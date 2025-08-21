from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from ..models.event_models import Event, EventParticipation, Mission, UserMission
from ..models.auth_models import User
from ..schemas.event_schemas import *
import logging

logger = logging.getLogger(__name__)

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
        return events
    
    @staticmethod
    def get_event_by_id(db: Session, event_id: int) -> Optional[Event]:
        """이벤트 상세 조회"""
        return db.query(Event).filter(Event.id == event_id).first()
    
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
        
        # 진행 상황 업데이트
        current_progress = participation.progress or {}
        current_progress.update(progress_data)
        participation.progress = current_progress
        
        # 완료 체크
        event = participation.event
        if EventService._check_event_completion(event, current_progress):
            participation.completed = True
            participation.completed_at = datetime.utcnow()
        
        db.commit()
        db.refresh(participation)
        return participation
    
    @staticmethod
    def _check_event_completion(event: Event, progress: Dict) -> bool:
        """이벤트 완료 조건 체크"""
        requirements = event.requirements or {}
        
        for key, required_value in requirements.items():
            if key not in progress or progress[key] < required_value:
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
        if 'gold' in rewards:
            user.gold_balance += rewards['gold']
        if 'exp' in rewards:
            # 일부 테스트/스키마 환경에서 experience 컬럼이 아직 없을 수 있으므로 방어적 처리
            if hasattr(user, 'experience'):
                try:
                    user.experience += rewards['exp']
                except Exception:
                    try:
                        setattr(user, 'experience', rewards['exp'])
                    except Exception:
                        pass
        
        participation.claimed_rewards = True
        db.commit()
        
        logger.info(f"User {user_id} claimed rewards for event {event_id}: {rewards}")
        return rewards

class MissionService:
    
    @staticmethod
    def get_user_missions(
        db: Session, 
        user_id: int, 
        mission_type: Optional[str] = None
    ) -> List[UserMission]:
        """사용자 미션 목록 조회"""
        query = db.query(UserMission).filter(UserMission.user_id == user_id)
        
        if mission_type:
            query = query.join(Mission).filter(Mission.mission_type == mission_type)
        
        return query.all()
    
    @staticmethod
    def initialize_daily_missions(db: Session, user_id: int):
        """일일 미션 초기화"""
        # 기존 일일 미션 리셋
        db.query(UserMission).filter(
            UserMission.user_id == user_id,
            UserMission.reset_at <= datetime.utcnow()
        ).delete()
        
        # 새로운 일일 미션 할당
        daily_missions = db.query(Mission).filter(
            Mission.mission_type == 'daily',
            Mission.is_active == True
        ).all()
        
        for mission in daily_missions:
            user_mission = UserMission(
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
        user_missions = db.query(UserMission).join(Mission).filter(
            UserMission.user_id == user_id,
            Mission.target_type == target_type,
            UserMission.completed == False
        ).all()
        
        completed_missions = []
        
        for user_mission in user_missions:
            user_mission.current_progress += increment
            
            # 완료 체크
            if user_mission.current_progress >= user_mission.mission.target_value:
                user_mission.completed = True
                user_mission.completed_at = datetime.utcnow()
                completed_missions.append(user_mission)
        
        db.commit()
        
        if completed_missions:
            logger.info(f"User {user_id} completed {len(completed_missions)} missions")
        
        return completed_missions
    
    @staticmethod
    def claim_mission_rewards(
        db: Session,
        user_id: int,
        mission_id: int
    ) -> Dict[str, Any]:
        """미션 보상 수령"""
        user_mission = db.query(UserMission).filter(
            UserMission.user_id == user_id,
            UserMission.mission_id == mission_id,
            UserMission.completed == True,
            UserMission.claimed == False
        ).first()
        
        if not user_mission:
            raise ValueError("보상을 받을 수 없습니다")
        
        mission = user_mission.mission
        rewards = mission.rewards or {}
        
        # 사용자에게 보상 지급
        user = db.query(User).filter(User.id == user_id).first()
        if 'gold' in rewards:
            user.gold_balance += rewards['gold']
        if 'exp' in rewards:
            if hasattr(user, 'experience'):
                try:
                    user.experience += rewards['exp']
                except Exception:
                    try:
                        setattr(user, 'experience', rewards['exp'])
                    except Exception:
                        pass
        
        user_mission.claimed = True
        user_mission.claimed_at = datetime.utcnow()
        db.commit()
        
        logger.info(f"User {user_id} claimed rewards for mission {mission_id}: {rewards}")
        return rewards