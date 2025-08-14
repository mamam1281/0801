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

    # === Added: System stats and user admin operations ===
    class _Stats:
        def __init__(self, total_users: int, active_users: int, total_games_played: int, total_tokens_in_circulation: int) -> None:
            self.total_users = total_users
            self.active_users = active_users
            self.total_games_played = total_games_played
            self.total_tokens_in_circulation = total_tokens_in_circulation

    def get_system_stats(self) -> "AdminService._Stats":
        """Aggregate basic system statistics for admin dashboard."""
        total_users = self.db.query(models.User).count()
        active_users = self.db.query(models.User).filter(models.User.is_active == True).count()  # noqa: E712
        total_games_played = self.db.query(models.UserAction).count()
        total_tokens_in_circulation = (
            self.db.query(models.User.cyber_token_balance).all()
        )
        total_tokens_sum = sum(v[0] or 0 for v in total_tokens_in_circulation)
        return AdminService._Stats(
            total_users=total_users,
            active_users=active_users,
            total_games_played=total_games_played,
            total_tokens_in_circulation=total_tokens_sum,
        )

    class _BanResult:
        def __init__(self, banned_until=None) -> None:
            self.banned_until = banned_until

    def ban_user(self, user_id: int, reason: str, duration_hours: Optional[int] = None) -> "AdminService._BanResult":
        """Minimal ban implementation: deactivate user; optionally log security event."""
        user = self.db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        user.is_active = False
        # Optional: record as security event
        try:
            evt = models.SecurityEvent(
                user_id=user.id,
                event_type="admin_ban",
                event_data=reason,
                is_suspicious=False,
            )
            self.db.add(evt)
        except Exception:
            # best-effort only
            pass
        self.db.add(user)
        self.db.commit()
        banned_until = None
        if duration_hours and duration_hours > 0:
            from datetime import datetime, timedelta
            banned_until = datetime.utcnow() + timedelta(hours=duration_hours)
        return AdminService._BanResult(banned_until=banned_until)

    def unban_user(self, user_id: int) -> None:
        user = self.db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        user.is_active = True
        self.db.add(user)
        self.db.commit()

    def add_user_tokens(self, user_id: int, amount: int) -> int:
        if amount <= 0:
            raise ValueError("Amount must be positive")
        user = self.db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        user.cyber_token_balance = int((user.cyber_token_balance or 0) + amount)
        self.db.add(user)
        self.db.commit()
        return user.cyber_token_balance
