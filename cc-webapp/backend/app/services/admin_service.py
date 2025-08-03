from sqlalchemy.orm import Session
from typing import List, Optional

from .. import models

class AdminService:
    def __init__(self, db: Session):
        self.db = db

    def list_users(self, skip: int, limit: int, search: Optional[str]) -> List[models.User]:
        """
        Lists users for the admin panel, with optional search.
        """
        query = self.db.query(models.User)
        if search:
            query = query.filter(
                (models.User.nickname.ilike(f"%{search}%")) |
                (models.User.site_id.ilike(f"%{search}%")) |
                (models.User.phone_number.ilike(f"%{search}%"))
            )
        return query.offset(skip).limit(limit).all()

    def get_user_details(self, user_id: int) -> models.User:
        """
        Gets a specific user by ID.
        """
        user = self.db.query(models.User).filter(models.User.id == user_id).first()
        return user

    def get_user_activities(self, user_id: int, limit: int = 10) -> List[models.UserAction]:
        """
        Gets recent activities for a specific user.
        """
        return self.db.query(models.UserAction).filter(models.UserAction.user_id == user_id).order_by(models.UserAction.created_at.desc()).limit(limit).all()

    def get_user_rewards(self, user_id: int, limit: int = 10) -> List[models.UserReward]:
        """
        Gets recent rewards for a specific user.
        """
        return self.db.query(models.UserReward).filter(models.UserReward.user_id == user_id).order_by(models.UserReward.awarded_at.desc()).limit(limit).all()

    def list_all_activities(self, skip: int, limit: int) -> List[models.UserAction]:
        """
        Gets a list of all recent user activities.
        """
        return self.db.query(models.UserAction).order_by(models.UserAction.created_at.desc()).offset(skip).limit(limit).all()
