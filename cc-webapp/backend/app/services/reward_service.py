from datetime import datetime, timezone
import json
import asyncio
from typing import Optional, Dict, Any

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError  # Import SQLAlchemyError

from app import models
from .token_service import TokenService
from ..realtime import manager

class RewardService:
    """Service for handling reward distribution and management"""
    
    def __init__(self, db: Session, token_service: TokenService | None = None):
        self.db = db
        self.token_service = token_service or TokenService(db)

    def distribute_reward(
        self,
        user_id: int,
        reward_type: str,
        amount: int,
        source_description: str,
        *,
        idempotency_key: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Distribute a reward transactionally with optional idempotency.

        Returns a serializable dict matching RewardItem: {reward_id, reward_type, reward_value, awarded_at}.
        """
        # Idempotency check: reuse prior grant if same key exists
        if idempotency_key:
            existing_action = (
                self.db.query(models.UserAction)
                .filter(
                    models.UserAction.user_id == user_id,
                    models.UserAction.action_type == "REWARD_GRANT",
                    models.UserAction.action_data == idempotency_key,
                )
                .first()
            )
            if existing_action:
                # Try to find the most recent reward for this user with matching description
                link = (
                    self.db.query(models.UserReward)
                    .filter(models.UserReward.user_id == user_id)
                    .order_by(models.UserReward.claimed_at.desc())
                    .first()
                )
                if link:
                    reward = self.db.query(models.Reward).filter(models.Reward.id == link.reward_id).first()
                    if reward:
                        return {
                            "reward_id": reward.id,
                            "reward_type": reward.reward_type,
                            "reward_value": str(int(reward.value) if reward.value is not None else 0),
                            "awarded_at": link.claimed_at,
                        }

        # Fresh grant path within a DB transaction
        try:
            now = datetime.now(timezone.utc)
            # Currency effects
            if reward_type.upper() in {"COIN", "TOKEN"}:
                self.token_service.add_tokens(user_id, amount)

            # Create a Reward master row
            reward = models.Reward(
                name=f"{reward_type}:{amount}",
                description=source_description,
                reward_type=reward_type.upper(),
                value=float(amount),
            )
            self.db.add(reward)
            self.db.flush()  # Get reward.id without committing

            # Link to user via UserReward
            user_reward = models.UserReward(
                user_id=user_id,
                reward_id=reward.id,
                claimed_at=now,
                is_used=False,
            )
            self.db.add(user_reward)

            # Idempotency marker as a UserAction
            if idempotency_key:
                action = models.UserAction(
                    user_id=user_id,
                    action_type="REWARD_GRANT",
                    action_data=idempotency_key,
                )
                self.db.add(action)

            self.db.commit()
            self.db.refresh(user_reward)

            # Async notification (best-effort)
            try:
                loop = asyncio.get_running_loop()
                loop.create_task(
                    manager.enqueue(
                        user_id,
                        {
                            "type": "REWARD_RECEIVED",
                            "payload": {
                                "reward_type": reward.reward_type,
                                "amount": amount,
                                "source": source_description,
                                "meta": metadata or {},
                            },
                        },
                        priority=3,
                        topic="rewards",
                    )
                )
            except RuntimeError:
                pass

            return {
                "reward_id": reward.id,
                "reward_type": reward.reward_type,
                "reward_value": str(int(reward.value) if reward.value is not None else 0),
                "awarded_at": user_reward.claimed_at,
            }
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
