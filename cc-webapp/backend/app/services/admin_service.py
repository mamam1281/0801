from sqlalchemy.orm import Session
from sqlalchemy import func
from types import SimpleNamespace
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
        return (
            self.db.query(models.UserReward)
            .filter(models.UserReward.user_id == user_id)
            .order_by(models.UserReward.claimed_at.desc())
            .limit(limit)
            .all()
        )

    def list_all_activities(self, skip: int, limit: int) -> List[models.UserAction]:
        """
        Gets a list of all recent user activities.
        """
        return self.db.query(models.UserAction).order_by(models.UserAction.created_at.desc()).offset(skip).limit(limit).all()

    # ---- Added admin operations used by admin router ----
    def ban_user(self, user_id: int, reason: str, duration_hours: Optional[int] = None):
        """
        Bans a user by setting is_active=False and recording a SecurityEvent.
        Note: No banned_until column exists; store reason in SecurityEvent for audit.
        """
        user = self.db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        if not user.is_active:
            # already inactive, still record
            pass
        user.is_active = False
        try:
            # Audit trail
            evt = models.SecurityEvent(
                user_id=user.id,
                event_type="admin_ban",
                event_data=reason or "",
                is_suspicious=False,
            )
            self.db.add(evt)
        except Exception:
            # Best-effort, continue
            pass
        self.db.commit()
        return SimpleNamespace(banned_until=None)

    def unban_user(self, user_id: int):
        user = self.db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        if user.is_active:
            return True
        user.is_active = True
        try:
            evt = models.SecurityEvent(
                user_id=user.id,
                event_type="admin_unban",
                event_data="",
                is_suspicious=False,
            )
            self.db.add(evt)
        except Exception:
            pass
        self.db.commit()
        return True

    def add_user_tokens(self, user_id: int, amount: int) -> int:
        user = self.db.query(models.User).filter(models.User.id == user_id).with_for_update().first()
        if not user:
            raise ValueError("User not found")
        user.cyber_token_balance = (user.cyber_token_balance or 0) + amount
        self.db.commit()
        return int(user.cyber_token_balance)

    def get_system_stats(self):
        """
        Returns aggregate system stats used by /api/admin/stats
        """
        total_users = self.db.query(func.count(models.User.id)).scalar() or 0
        active_users = self.db.query(func.count(models.User.id)).filter(models.User.is_active == True).scalar() or 0
        total_games_played = self.db.query(func.count(models.GameSession.id)).scalar() or 0
        total_tokens_in_circulation = self.db.query(func.coalesce(func.sum(models.User.cyber_token_balance), 0)).scalar() or 0
        return SimpleNamespace(
            total_users=int(total_users),
            active_users=int(active_users),
            total_games_played=int(total_games_played),
            total_tokens_in_circulation=int(total_tokens_in_circulation),
        )

    def update_user_fields(self, user_id: int, *, is_admin: Optional[bool] = None, is_active: Optional[bool] = None, user_rank: Optional[str] = None) -> Optional[models.User]:
        u = self.db.query(models.User).filter(models.User.id == user_id).first()
        if not u:
            return None
        if is_admin is not None:
            u.is_admin = bool(is_admin)
        if is_active is not None:
            u.is_active = bool(is_active)
        if user_rank is not None:
            # Column name is user_rank (mapped to vip_tier), also accept 'rank'
            setattr(u, 'user_rank', user_rank)
        self.db.commit()
        return u

    def delete_user(self, user_id: int) -> bool:
        u = self.db.query(models.User).filter(models.User.id == user_id).first()
        if not u:
            return False
        try:
            self.db.delete(u)
            self.db.commit()
            return True
        except Exception:
            self.db.rollback()
            return False

