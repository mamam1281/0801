from datetime import datetime, timezone

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError # Import SQLAlchemyError

from app import models
from .token_service import TokenService
from ..websockets import manager
import asyncio

class RewardService:
    """Service for handling reward distribution and management"""
    
    def __init__(self, db: Session, token_service: TokenService | None = None):
        self.db = db
        self.token_service = token_service or TokenService(db)

    def distribute_reward(self, user_id: int, reward_type: str, amount: int, source_description: str) -> models.UserReward:
        """
        Distributes a reward to a user, updating their token balance and logging the transaction.
        """
        if reward_type.upper() == "COIN" or reward_type.upper() == "TOKEN":
            self.token_service.add_tokens(user_id, amount)
        else:
            # Placeholder for other reward types like items, etc.
            pass

        db_user_reward = models.UserReward(
            user_id=user_id,
            reward_type=reward_type,
            reward_value=str(amount),
            source_description=source_description,
            awarded_at=datetime.now(timezone.utc),
        )
        try:
            self.db.add(db_user_reward)
            self.db.commit()
            self.db.refresh(db_user_reward)

            # Send notification
            try:
                loop = asyncio.get_running_loop()
                loop.create_task(manager.send_personal_message({
                    "type": "REWARD_RECEIVED",
                    "payload": {
                        "reward_type": reward_type,
                        "amount": amount,
                        "source": source_description
                    }
                }, user_id))
            except RuntimeError: # No running event loop
                pass

            return db_user_reward
        except SQLAlchemyError as e:
            self.db.rollback()
            raise e

    def grant_content_unlock(
        self,
        user_id: int,
        content_id: int,
        stage_name: str,
        source_description: str,
        awarded_at: datetime = None,
    ) -> models.UserReward:
        if awarded_at is None:
            awarded_at = datetime.now(timezone.utc)

        reward_value = f"{content_id}_{stage_name}"

        db_user_reward = models.UserReward(
            user_id=user_id,
            reward_type="CONTENT_UNLOCK",
            reward_value=reward_value,
            source_description=source_description,
            awarded_at=awarded_at,
        )
        try:
            self.db.add(db_user_reward)
            self.db.commit()
            self.db.refresh(db_user_reward)
            return db_user_reward
        except SQLAlchemyError as e:
            self.db.rollback()
            # Optionally log the error e
            # logging.error(f"Database error in grant_content_unlock: {e}")
            raise e
