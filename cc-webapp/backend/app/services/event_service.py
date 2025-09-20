from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, cast
from ..models.event_models import Event, EventParticipation, Mission, UserMission as UserMissionProgress
from ..models.auth_models import User
# 주의: 스키마 별표 임포트는 모델 심볼과 이름 충돌을 일으킬 수 있으므로 금지
# (예: Pydantic UserMissionProgress 가 SQLAlchemy UserMission 별칭을 덮어씀)
import logging

logger = logging.getLogger(__name__)

# --- local safe casting helpers (for static analysis friendliness) ---
def _to_int(v: Any, default: int = 0) -> int:
    try:
        if v is None:
            return default
        # SQLAlchemy ColumnElement/InstrumentedAttribute 방어
        if hasattr(v, "__int__"):
            return int(v)  # type: ignore[arg-type]
        return int(v)  # type: ignore[arg-type]
    except Exception:
        return default

def _to_bool(v: Any) -> bool:
    try:
        if isinstance(v, bool):
            return v
        if v is None:
            return False
        return bool(v)
    except Exception:
        return False

def _to_dict(v: Any) -> Dict[str, Any]:
    try:
        if isinstance(v, dict):
            return v
        if v is None:
            return {}
        # 일부 드라이버가 JSON을 Instrumented/Column으로 보일 수 있으므로 강제 변환 시도
        return dict(v)  # type: ignore[arg-type]
    except Exception:
        return {}

class EventService:
    
    @staticmethod
    def get_active_events(db: Session) -> List[Event]:
        """활성 이벤트 목록 조회"""
        now = datetime.utcnow()
        events = db.query(Event).filter(
            Event.is_active == True,
            Event.start_date <= now,
            Event.end_date >= now
        ).order_by(Event.priority.desc()).all()

        # 참여자 수를 각 인스턴스에 임시 속성으로 부여 (Pydantic 직렬화 시 participation_count 사용)
        if events:
            # 이벤트별 참여 카운트 일괄 조회
            counts = (
                db.query(EventParticipation.event_id, func.count(EventParticipation.id).label("cnt"))
                .filter(EventParticipation.event_id.in_([e.id for e in events]))
                .group_by(EventParticipation.event_id)
                .all()
            )
            count_map = {row.event_id: row.cnt for row in counts}
            for e in events:
                # 모델에 없는 임시 속성 지정 -> schema.EventResponse.participation_count 매핑
                setattr(e, "participation_count", count_map.get(e.id, 0))
                # 응답 직전 필수 필드 보정 (DB NULL 방어)
                if getattr(e, "rewards", None) is None:
                    setattr(e, "rewards", {})
                if getattr(e, "requirements", None) is None:
                    setattr(e, "requirements", {})
        return events
    
    @staticmethod
    def get_event_by_id(db: Session, event_id: int) -> Optional[Event]:
        """이벤트 상세 조회"""
        ev = db.query(Event).filter(Event.id == event_id).first()
        if ev is not None:
            # 응답 직전 필수 필드 보정 (DB NULL 방어)
            if getattr(ev, "rewards", None) is None:
                setattr(ev, "rewards", {})
            if getattr(ev, "requirements", None) is None:
                setattr(ev, "requirements", {})
        return ev
    
    @staticmethod
    def join_event(db: Session, user_id: int, event_id: int) -> EventParticipation:
        """이벤트 참여"""
        # 이미 참여 중인지 확인
        existing = db.query(EventParticipation).filter(
            EventParticipation.user_id == user_id,
            EventParticipation.event_id == event_id
        ).first()
        
        if existing:
            return existing
        
        # 새로운 참여 생성
        participation = EventParticipation(
            user_id=user_id,
            event_id=event_id,
            progress={}
        )
        db.add(participation)
        db.commit()
        db.refresh(participation)
        
        logger.info(f"User {user_id} joined event {event_id}")
        return participation
    
    @staticmethod
    def update_event_progress(
        db: Session, 
        user_id: int, 
        event_id: int, 
        progress_data: Dict[str, Any]
    ) -> EventParticipation:
        """이벤트 진행 상황 업데이트"""
        participation = db.query(EventParticipation).filter(
            EventParticipation.user_id == user_id,
            EventParticipation.event_id == event_id
        ).first()
        
        if not participation:
            participation = EventService.join_event(db, user_id, event_id)
        
        # 진행 상황 업데이트 (숫자형 값은 누적, 그 외는 overwrite)
        current_progress: Dict[str, Any] = _to_dict(getattr(participation, "progress", None))
        for k, v in (progress_data or {}).items():
            if isinstance(v, (int, float)) and isinstance(current_progress.get(k), (int, float)):
                base = current_progress.get(k, 0)
                current_progress[k] = _to_int(base) + _to_int(v)
            else:
                # 새 키이거나 비숫자형 → 덮어쓰기
                current_progress[k] = v
        setattr(participation, "progress", current_progress)
        # progress version & timestamp 갱신
        try:
            pv = _to_int(getattr(participation, "progress_version", 0)) + 1
            setattr(participation, "progress_version", pv)
        except Exception:
            setattr(participation, "progress_version", 1)
        from datetime import datetime as _dt
        setattr(participation, "last_progress_at", _dt.utcnow())
        
        # 완료 체크: 요구 조건 모두 충족 시 completed 설정 (idempotent)
        event = participation.event
        if EventService._check_event_completion(event, current_progress):
            if not _to_bool(getattr(participation, "completed", False)):
                setattr(participation, "completed", True)
                setattr(participation, "completed_at", datetime.utcnow())
                logger.debug(
                    "event_progress_completed",
                    extra={
                        "event_id": event.id,
                        "user_id": user_id,
                        "progress": current_progress,
                        "requirements": event.requirements,
                    },
                )
        
        db.commit()
        db.refresh(participation)
        
        # 실시간 브로드캐스트: 이벤트 진행도 업데이트
        try:
            from ..routers.realtime import broadcast_event_progress
            import asyncio
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(broadcast_event_progress(
                    user_id=user_id,
                    event_id=event_id,
                    progress=current_progress,
                    completed=_to_bool(getattr(participation, "completed", False))
                ))
        except Exception:
            pass
        
        return participation
    
    @staticmethod
    def _check_event_completion(event: Event, progress: Dict[str, Any]) -> bool:
        """이벤트 완료 조건 체크"""
        requirements: Dict[str, Any] = _to_dict(getattr(event, "requirements", None))
        for key, required_value in requirements.items():
            cur = progress.get(key, 0)
            try:
                if isinstance(required_value, (int, float)):
                    if _to_int(cur) < _to_int(required_value):
                        return False
                else:
                    if cur != required_value:
                        return False
            except Exception:
                return False
        
        return True
    
    @staticmethod
    def claim_event_rewards(
        db: Session, 
        user_id: int, 
        event_id: int
    ) -> Dict[str, Any]:
        """이벤트 보상 수령"""
        participation = db.query(EventParticipation).filter(
            EventParticipation.user_id == user_id,
            EventParticipation.event_id == event_id,
            EventParticipation.completed == True,
            EventParticipation.claimed_rewards == False
        ).first()
        
        if not participation:
            raise ValueError("보상을 받을 수 없습니다")
        
        event = participation.event
        rewards = event.rewards or {}
        
        # 사용자에게 보상 지급
        user = db.query(User).filter(User.id == user_id).first()
        if user is not None:
            if 'gold' in rewards:
                new_balance = _to_int(getattr(user, 'gold_balance', 0)) + _to_int(rewards.get('gold'), 0)
                setattr(user, 'gold_balance', new_balance)
            if 'exp' in rewards and hasattr(user, 'experience'):
                try:
                    new_exp = _to_int(getattr(user, 'experience', 0)) + _to_int(rewards.get('exp'), 0)
                    setattr(user, 'experience', new_exp)
                except Exception:
                    try:
                        setattr(user, 'experience', _to_int(rewards.get('exp'), 0))
                    except Exception:
                        pass
        # 보상 수령 상태 업데이트 및 커밋
        setattr(participation, 'claimed_rewards', True)
        try:
            setattr(participation, 'claimed_at', datetime.utcnow())
        except Exception:
            pass
        db.commit()
        
        # 실시간 브로드캐스트: 보상 지급 + 프로필 변경
        try:
            from ..routers.realtime import broadcast_reward_granted, broadcast_profile_update
            import asyncio
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # 보상 지급 알림
                if 'gold' in rewards and user is not None:
                    loop.create_task(broadcast_reward_granted(
                        user_id=user_id,
                        reward_type="event_reward",
                        amount=_to_int(rewards.get('gold'), 0),
                        balance_after=_to_int(getattr(user, 'gold_balance', 0))
                    ))
                
                # 프로필 변경 알림
                profile_changes: Dict[str, Any] = {}
                if 'gold' in rewards and user is not None:
                    profile_changes["gold_balance"] = _to_int(getattr(user, 'gold_balance', 0))
                if 'exp' in rewards and user is not None and hasattr(user, 'experience'):
                    profile_changes["experience"] = _to_int(getattr(user, 'experience', 0))
                
                if profile_changes:
                    loop.create_task(broadcast_profile_update(
                        user_id=user_id,
                        changes=profile_changes
                    ))
        except Exception:
            pass
        
        logger.info(f"User {user_id} claimed rewards for event {event_id}: {rewards}")
        return rewards

class MissionService:
    
    @staticmethod
    def _sanitize_mission_payload(um: UserMissionProgress):
        """
        직렬화 전에 UserMission 및 연결된 Mission 인스턴스의 NULL 필드를 안전 보정한다.
        - mission.rewards/requirements 가 NULL이면 빈 dict로 대체
        - user_mission.current_progress 가 NULL이면 0으로 대체
        """
        try:
            if getattr(um, "current_progress", None) is None:
                setattr(um, "current_progress", 0)
        except Exception:
            pass
        try:
            m = getattr(um, "mission", None)
            if m is not None:
                if getattr(m, "rewards", None) is None:
                    setattr(m, "rewards", {})
                if getattr(m, "requirements", None) is None:
                    setattr(m, "requirements", {})
        except Exception:
            pass

    @staticmethod
    def get_user_missions(
        db: Session, 
        user_id: int, 
        mission_type: Optional[str] = None
    ) -> List[UserMissionProgress]:
        """사용자 미션 목록 조회"""
        query = db.query(UserMissionProgress).filter(UserMissionProgress.user_id == user_id)
        
        if mission_type:
            query = query.join(Mission).filter(Mission.mission_type == mission_type)

        items = query.all()
        # 직렬화 전 NULL 방어 보정
        for um in items:
            MissionService._sanitize_mission_payload(um)
        return items
    
    @staticmethod
    def initialize_daily_missions(db: Session, user_id: int):
        """일일 미션 초기화"""
        # 기존 일일 미션 리셋
        db.query(UserMissionProgress).filter(
            UserMissionProgress.user_id == user_id,
            UserMissionProgress.reset_at <= datetime.utcnow()
        ).delete()
        
        # 새로운 일일 미션 할당
        daily_missions = db.query(Mission).filter(
            Mission.mission_type == 'daily',
            Mission.is_active == True
        ).all()
        
        for mission in daily_missions:
            user_mission = UserMissionProgress(
                user_id=user_id,
                mission_id=mission.id,
                current_progress=0,
                reset_at=datetime.utcnow() + timedelta(days=1)
            )
            db.add(user_mission)
        
        db.commit()
        logger.info(f"Initialized daily missions for user {user_id}")
    
    @staticmethod
    def update_mission_progress(
        db: Session,
        user_id: int,
        target_type: str, 
        increment: int = 1
    ):
        """미션 진행 상황 업데이트"""
        # 해당 타입의 모든 미션 조회
        user_missions = db.query(UserMissionProgress).join(Mission).filter(
            UserMissionProgress.user_id == user_id,
            Mission.target_type == target_type,
            UserMissionProgress.completed == False
        ).all()
        
        completed_missions = []
        
        from datetime import datetime as _dt
        for user_mission in user_missions:
            # 진행도 증가
            cur = _to_int(getattr(user_mission, 'current_progress', 0))
            setattr(user_mission, 'current_progress', cur + _to_int(increment, 0))
            # progress version/timestamp
            try:
                pv = _to_int(getattr(user_mission, 'progress_version', 0)) + 1
                setattr(user_mission, 'progress_version', pv)
            except Exception:
                setattr(user_mission, 'progress_version', 1)
            setattr(user_mission, 'last_progress_at', _dt.utcnow())
            
            # 완료 체크
            target_val = _to_int(getattr(getattr(user_mission, 'mission', None), 'target_value', 0))
            if _to_int(getattr(user_mission, 'current_progress', 0)) >= target_val:
                setattr(user_mission, 'completed', True)
                setattr(user_mission, 'completed_at', datetime.utcnow())
                completed_missions.append(user_mission)
        
        db.commit()
        
        if completed_missions:
            logger.info(f"User {user_id} completed {len(completed_missions)} missions")
        
        return completed_missions

    @staticmethod
    def update_mission_progress_by_mission_id(
        db: Session,
        user_id: int,
        mission_id: int,
        increment: int = 1,
    ):
        """
        미션 진행 상황 업데이트 (mission_id 기준)

        - 지정된 mission_id에 대한 사용자 진행도를 증가시키고, 목표 달성 시 completed 처리
        - 기존 레코드가 없으면 UserMission을 생성한 뒤 진행도를 반영
        """
        # 대상 미션 조회 (필수)
        mission = db.query(Mission).filter(Mission.id == mission_id, Mission.is_active == True).first()
        if not mission:
            # 존재하지 않거나 비활성 미션이면 업데이트할 것이 없음
            return []

        # 사용자 미션 진행 레코드 확보
        user_mission = db.query(UserMissionProgress).filter(
            UserMissionProgress.user_id == user_id,
            UserMissionProgress.mission_id == mission_id,
            UserMissionProgress.completed == False,
        ).first()

        if not user_mission:
            # 기존 진행이 없으면 새로 생성(초기값 0)
            user_mission = UserMissionProgress(
                user_id=user_id,
                mission_id=mission_id,
                current_progress=0,
            )
            db.add(user_mission)

        # 진행도 증가 및 메타 갱신
        cur = _to_int(getattr(user_mission, 'current_progress', 0))
        setattr(user_mission, 'current_progress', cur + _to_int(increment, 0))
        try:
            pv = _to_int(getattr(user_mission, 'progress_version', 0)) + 1
            setattr(user_mission, 'progress_version', pv)
        except Exception:
            setattr(user_mission, 'progress_version', 1)
        from datetime import datetime as _dt
        setattr(user_mission, 'last_progress_at', _dt.utcnow())

        completed_missions = []
        if _to_int(getattr(user_mission, 'current_progress', 0)) >= _to_int(getattr(mission, 'target_value', 0)):
            setattr(user_mission, 'completed', True)
            setattr(user_mission, 'completed_at', _dt.utcnow())
            completed_missions.append(user_mission)

        db.commit()
        # 응답 직전 직렬화 안전 보정
        for um in completed_missions:
            MissionService._sanitize_mission_payload(um)
        return completed_missions
    
    @staticmethod
    def claim_mission_rewards(
        db: Session,
        user_id: int,
        mission_id: int
    ) -> Dict[str, Any]:
        """미션 보상 수령"""
        user_mission = db.query(UserMissionProgress).filter(
            UserMissionProgress.user_id == user_id,
            UserMissionProgress.mission_id == mission_id,
            UserMissionProgress.completed == True,
            UserMissionProgress.claimed == False
        ).first()
        
        if not user_mission:
            raise ValueError("보상을 받을 수 없습니다")
        mission = user_mission.mission
        rewards = _to_dict(getattr(mission, 'rewards', None))

        # 사용자에게 보상 지급
        user = db.query(User).filter(User.id == user_id).first()
        if user is not None:
            if 'gold' in rewards:
                new_balance = _to_int(getattr(user, 'gold_balance', 0)) + _to_int(rewards.get('gold'), 0)
                setattr(user, 'gold_balance', new_balance)
            if 'exp' in rewards and hasattr(user, 'experience'):
                try:
                    new_exp = _to_int(getattr(user, 'experience', 0)) + _to_int(rewards.get('exp'), 0)
                    setattr(user, 'experience', new_exp)
                except Exception:
                    try:
                        setattr(user, 'experience', _to_int(rewards.get('exp'), 0))
                    except Exception:
                        pass

        setattr(user_mission, 'claimed', True)
        setattr(user_mission, 'claimed_at', datetime.utcnow())
        # progress_version 최종 1 증가 (claim 자체 버전 반영) & timestamp
        try:
            pv = _to_int(getattr(user_mission, 'progress_version', 0)) + 1
            setattr(user_mission, 'progress_version', pv)
        except Exception:
            setattr(user_mission, 'progress_version', 1)
        from datetime import datetime as _dt
        setattr(user_mission, 'last_progress_at', _dt.utcnow())
        db.commit()

        logger.info(
            f"User {user_id} claimed rewards for mission {mission_id}: {rewards}",
            extra={"mission_id": mission_id, "progress_version": user_mission.progress_version}
        )
        return {
            "rewards": rewards,
            "balance": getattr(user, 'gold_balance', None),
            "progress_version": user_mission.progress_version,
        }