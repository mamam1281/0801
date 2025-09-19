from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json

from .. import models
from .reward_service import RewardService

class MissionService:
    @staticmethod
    def get_user_missions(db: Session, user_id: int, mission_type: Optional[str] = None) -> List[dict]:
        """
        사용자의 미션 목록을 조회합니다.
        반환 구조는 UserMissionResponse 스키마와 일치합니다.
        mission_type이 지정되면 해당 타입의 미션만 반환합니다.
        """
        query = db.query(models.Mission).filter(models.Mission.is_active == True)
        if mission_type:
            query = query.filter(models.Mission.mission_type == mission_type)

        active_missions = query.all()
        user_progress = db.query(models.UserMission).filter(models.UserMission.user_id == user_id).all()

        progress_map = {getattr(p, 'mission_id', 0): p for p in user_progress}

        results: List[dict] = []
        for mission in active_missions:
            m_id = getattr(mission, 'id', 0)
            progress = progress_map.get(m_id)
            if progress is None:
                # 미션 진행 상황이 없으면 생성
                progress = models.UserMission(
                    user_id=user_id,
                    mission_id=m_id,
                    current_progress=0,
                    completed=False,
                    claimed=False,
                )
                # started_at 등 타임스탬프 필드가 있다면 초기화
                if hasattr(progress, 'started_at') and getattr(progress, 'started_at') is None:
                    setattr(progress, 'started_at', datetime.utcnow())
                db.add(progress)
                db.commit()
                try:
                    db.refresh(progress)
                except Exception:
                    pass

            # MissionResponse에 해당하는 서브 구조 구성
            mission_dict = {
                "id": m_id,
                "title": getattr(mission, 'title', ''),
                "description": getattr(mission, 'description', None),
                "mission_type": getattr(mission, 'mission_type', ''),
                "category": getattr(mission, 'category', None),
                "target_value": getattr(mission, 'target_value', 0),
                "target_type": getattr(mission, 'target_type', ''),
                "rewards": getattr(mission, 'rewards', {}) or {},
                "requirements": getattr(mission, 'requirements', {}) or {},
                "reset_period": getattr(mission, 'reset_period', None),
                "icon": getattr(mission, 'icon', None),
                "is_active": bool(getattr(mission, 'is_active', True)),
                "sort_order": getattr(mission, 'sort_order', 0) or 0,
                "created_at": getattr(mission, 'created_at', datetime.utcnow()),
            }

            results.append({
                "id": getattr(progress, 'id', 0) or 0,
                "user_id": user_id,
                "mission_id": m_id,
                "current_progress": getattr(progress, 'current_progress', 0) or 0,
                "completed": bool(getattr(progress, 'completed', False)),
                "claimed": bool(getattr(progress, 'claimed', False)),
                "started_at": getattr(progress, 'started_at', None),
                "completed_at": getattr(progress, 'completed_at', None),
                "claimed_at": getattr(progress, 'claimed_at', None),
                "reset_at": getattr(progress, 'reset_at', None),
                "mission": mission_dict,
            })

        return results

    @staticmethod
    def initialize_daily_missions(db: Session, user_id: int):
        """
        사용자의 일일 미션을 초기화합니다.
        """
        # 이미 존재하는 일일 미션 진행 상황은 유지
        existing_progress = db.query(models.UserMission).join(models.Mission).filter(
            models.UserMission.user_id == user_id,
            models.Mission.mission_type == 'daily',
            models.Mission.is_active == True
        ).all()

        existing_mission_ids = {p.mission_id for p in existing_progress}

        # 새로운 일일 미션에 대해 진행 상황 생성
        daily_missions = db.query(models.Mission).filter(
            models.Mission.mission_type == 'daily',
            models.Mission.is_active == True
        ).all()

        for mission in daily_missions:
            if mission.id not in existing_mission_ids:
                new_progress = models.UserMission(
                    user_id=user_id,
                    mission_id=mission.id,
                    current_progress=0,
                    completed=False,
                    claimed=False
                )
                db.add(new_progress)

        db.commit()

    @staticmethod
    def update_mission_progress(db: Session, user_id: int, target_type: str, progress_increment: int):
        """
        미션 진행 상황을 업데이트합니다.
        """
        # 해당 target_type을 가진 활성 미션들 조회
        relevant_missions = db.query(models.Mission).filter(
            models.Mission.is_active == True,
            models.Mission.target_type == target_type
        ).all()

        completed_missions = []

        for mission in relevant_missions:
            # 사용자 미션 진행 상황 조회 또는 생성
            progress = db.query(models.UserMission).filter_by(
                user_id=user_id,
                mission_id=mission.id
            ).first()

            if not progress:
                progress = models.UserMission(
                    user_id=user_id,
                    mission_id=mission.id,
                    current_progress=0,
                    completed=False,
                    claimed=False
                )
                db.add(progress)

            # 진행 상황 업데이트
            if getattr(progress, 'completed', False) is False:
                current_progress = getattr(progress, 'current_progress', 0) + progress_increment
                setattr(progress, 'current_progress', current_progress)
                setattr(progress, 'last_progress_at', datetime.utcnow())

                if current_progress >= getattr(mission, 'target_value', 0):
                    setattr(progress, 'completed', True)
                    setattr(progress, 'completed_at', datetime.utcnow())
                    completed_missions.append({
                        "mission_id": getattr(mission, 'id', 0),
                        "title": getattr(mission, 'title', ''),
                        "reward_amount": getattr(mission, 'rewards', {}).get('gold', 0) if getattr(mission, 'rewards', None) else 0,
                        "reward_type": "gold"
                    })

        db.commit()
        return completed_missions

    @staticmethod
    def claim_mission_rewards(db: Session, user_id: int, mission_id: int):
        """
        미션 보상을 청구합니다.
        """
        # 미션 진행 상황 조회
        progress = db.query(models.UserMission).filter_by(
            user_id=user_id,
            mission_id=mission_id
        ).first()

        if not progress or getattr(progress, 'completed', False) is False:
            raise ValueError("미션이 완료되지 않았습니다.")

        if getattr(progress, 'claimed', False) is True:
            raise ValueError("이미 보상을 수령했습니다.")

        # 미션 정보 조회
        mission = db.query(models.Mission).filter_by(id=mission_id).first()
        if not mission:
            raise ValueError("미션을 찾을 수 없습니다.")

        # 보상 지급
        rewards = getattr(mission, 'rewards', None) or {}
        gold_amount = rewards.get('gold', 0) if isinstance(rewards, dict) else 0

        new_balance = None
        if gold_amount > 0:
            # 사용자 골드 잔액 업데이트
            user = db.query(models.User).filter_by(id=user_id).first()
            if user:
                current_balance = getattr(user, 'gold_balance', 0) or 0
                new_balance = current_balance + gold_amount
                setattr(user, 'gold_balance', new_balance)

        # 미션 완료 처리
        setattr(progress, 'claimed', True)
        setattr(progress, 'claimed_at', datetime.utcnow())

        db.commit()

        claimed_at = getattr(progress, 'claimed_at', None)
        # 라우터에서 기대하는 키(rewards, balance, progress_version)를 포함하여 반환
        return {
            "mission_id": mission_id,
            "rewards": {"gold": gold_amount} if gold_amount else {},
            "balance": new_balance,
            "progress_version": None,
            "claimed_at": claimed_at.isoformat() if claimed_at else None,
        }
