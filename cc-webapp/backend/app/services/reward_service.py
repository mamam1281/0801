from datetime import datetime, timezone
import json
import asyncio
from typing import Optional, Dict, Any

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError  # Import SQLAlchemyError

from app import models
from .token_service import TokenService
# realtime hub (단순 브로드캐스트만 사용)
try:  # pragma: no cover - optional during tests
    from ..realtime import hub as _realtime_hub  # type: ignore
except Exception:  # pragma: no cover
    _realtime_hub = None
from .email_service import EmailService

class RewardService:
    """Service for handling reward distribution and management"""
    
    def __init__(self, db: Session, token_service: TokenService | None = None):
        self.db = db
        self.token_service = token_service or TokenService(db)

    # 단일 add(commit) 호환 모드 플래그 (테스트 호환 목적)
    SINGLE_ADD_COMPAT = True

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

            if self.SINGLE_ADD_COMPAT:
                # Reward + UserReward 객체 생성 후 UserReward만 add → Reward는 relationship lazy load 시 접근
                reward = models.Reward(
                    name=f"{reward_type}:{amount}",
                    description=source_description,
                    reward_type=reward_type.upper(),
                    value=float(amount),
                )
                user_reward = models.UserReward(
                    user_id=user_id,
                    reward=reward,
                    claimed_at=now,
                    is_used=False,
                )
                self.db.add(user_reward)
            else:
                reward = models.Reward(
                    name=f"{reward_type}:{amount}",
                    description=source_description,
                    reward_type=reward_type.upper(),
                    value=float(amount),
                )
                self.db.add(reward)
                self.db.flush()
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

            # 브로드캐스트 (best-effort, 스로틀 적용 대상)
            if _realtime_hub is not None:
                try:
                    loop = asyncio.get_running_loop()
                    # reward_grant 이벤트
                    loop.create_task(
                        _realtime_hub.broadcast(
                            {
                                "type": "reward_grant",
                                "user_id": user_id,
                                "reward_type": reward.reward_type,
                                "amount": amount,
                                "source": source_description,
                            }
                        )
                    )
                    # balance_update 이벤트 (현재 토큰/코인 잔액 포함)
                    try:
                        balance = self.token_service.get_token_balance(user_id)
                    except Exception:
                        balance = None
                    loop.create_task(
                        _realtime_hub.broadcast(
                            {
                                "type": "balance_update",
                                "user_id": user_id,
                                "balance": balance,
                            }
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
        finally:
            # Best-effort reward email (do not block the transaction outcome)
            try:
                user = self.db.query(models.User).filter(models.User.id == user_id).first()
                if user:
                    EmailService().send_template_to_user(
                        user,
                        "reward",
                        {
                            "nickname": getattr(user, "nickname", getattr(user, "site_id", "user")),
                            "reward": f"{reward_type}:{amount}",
                            "balance": TokenService(self.db).get_token_balance(user_id),
                        },
                    )
            except Exception:
                # swallow errors (logging optional)
                pass

    def grant_content_unlock(
        self,
        user_id: int,
        content_id: int,
        stage_name: str,
        source_description: str,
        awarded_at: datetime = None,
    ) -> models.UserReward:
        """콘텐츠 스테이지 해제 보상 - Reward + UserReward 링크 구조 재사용.

        기존 테스트가 UserReward(reward_type=..., reward_value=...) 형태를 기대했으나
        현재 UserReward 모델에는 해당 필드가 없으므로 Reward 테이블에 메타 저장.
        name: CONTENT_UNLOCK:{content_id}:{stage_name}
        description: source_description
        reward_type: CONTENT_UNLOCK
        value: 0
        """
        if awarded_at is None:
            awarded_at = datetime.now(timezone.utc)
        try:
            reward = models.Reward(
                name=f"CONTENT_UNLOCK:{content_id}:{stage_name}",
                description=source_description,
                reward_type="CONTENT_UNLOCK",
                value=0.0,
            )
            self.db.add(reward)
            self.db.flush()
            link = models.UserReward(
                user_id=user_id,
                reward_id=reward.id,
                claimed_at=awarded_at,
                is_used=False,
            )
            self.db.add(link)
            self.db.commit()
            self.db.refresh(link)
            return link
        except SQLAlchemyError as e:
            self.db.rollback()
            raise e
