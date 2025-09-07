from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from .. import models
from .reward_service import RewardService

class MissionService:
    def __init__(self, db: Session):
        self.db = db

    def list_user_missions(self, user_id: int) -> List[dict]:
        """
        Lists all active missions and the user's progress for each.
        """
        active_missions = self.db.query(models.Mission).filter(models.Mission.is_active == True).all()
        user_progress = self.db.query(models.UserMission).filter(models.UserMission.user_id == user_id).all()

        progress_map = {p.mission_id: p for p in user_progress}

        missions_with_progress = []
        for mission in active_missions:
            progress = progress_map.get(mission.id)
            # rewards JSON에서 정보 추출
            reward_info = mission.rewards if mission.rewards else {}
            missions_with_progress.append({
                "mission_id": mission.id,
                "title": mission.title,
                "description": mission.description,
                "target_value": mission.target_value,
                "target_type": mission.target_type,
                "rewards": mission.rewards,
                "current_progress": progress.current_progress if progress else 0,
                "completed": progress.completed if progress else False,
                "claimed": progress.claimed if progress else False,
            })
        return missions_with_progress

    def update_mission_progress(self, user_id: int, action_type: str):
        """
        Updates mission progress for a user based on an action they took.
        """
        # Find all active missions related to this action
        relevant_missions = self.db.query(models.Mission).filter(
            models.Mission.is_active == True,
            models.Mission.target_type == action_type
        ).all()

        for mission in relevant_missions:
            progress = self.db.query(models.UserMission).filter_by(user_id=user_id, mission_id=mission.id).first()
            if not progress:
                progress = models.UserMission(user_id=user_id, mission_id=mission.id)
                self.db.add(progress)

            if not progress.completed:
                progress.current_progress += 1
                if progress.current_progress >= mission.target_value:
                    progress.completed = True
                    progress.completed_at = datetime.utcnow()

        self.db.commit()

    def claim_reward(self, user_id: int, mission_id: int) -> models.UserReward:
        """
        Allows a user to claim the reward for a completed, unclaimed mission.
        """
        progress = self.db.query(models.UserMission).filter_by(user_id=user_id, mission_id=mission_id).first()

        if not progress or not progress.completed:
            raise ValueError("Mission not completed.")

        if progress.claimed:
            raise ValueError("Reward already claimed.")

        mission = self.db.query(models.Mission).filter_by(id=mission_id).one()

        # rewards는 JSON 필드이므로 파싱 필요
        reward_info = mission.rewards if mission.rewards else {}
        reward_type = reward_info.get('type', 'cyber_token')
        reward_amount = reward_info.get('amount', 100)

        reward_service = RewardService(self.db)
        user_reward = reward_service.distribute_reward(
            user_id=user_id,
            reward_type=reward_type,
            amount=reward_amount,
            source_description=f"Mission Complete: {mission.title}"
        )

        progress.claimed = True
        progress.claimed_at = datetime.utcnow()
        self.db.commit()

        return user_reward
