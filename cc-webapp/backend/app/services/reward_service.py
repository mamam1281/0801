"""보상 관련 최소 유틸/service 모듈.

슬림화 정책(2025-08-20):
 - streak 일일 보상 산식만 유지 (calculate_streak_daily_reward)
 - RewardService 에서 브로드캐스트/이메일 사이드이펙트 제거 (성능/결합도 축소)
 - TokenService 잔액 업데이트만 보존
"""
from __future__ import annotations
from math import exp
from datetime import datetime, timezone

def calculate_streak_daily_reward(streak_count: int) -> tuple[int, int]:
    """1일차부터 시작하는 선형 증가 기반 골드/XP 산출.

    Gold = 800 + (streak_count * 200)  (1일차: 1000, 2일차: 1200, 3일차: 1400...)
    XP   = 25  + (streak_count * 25)   (1일차: 50, 2일차: 75, 3일차: 100...)

    Args:
        streak_count: 현재 유지 중인 연속 출석 일수(>=1, 1일차부터 시작)
    Returns:
        (gold:int, xp:int)
    """
    # 1일차부터 시작하는 선형 증가 공식
    base_gold = 800  # 1일차에 1000골드가 되도록 조정
    gold_per_day = 200
    gold = base_gold + (streak_count * gold_per_day)
    
    base_xp = 25   # 1일차에 50XP가 되도록 조정
    xp_per_day = 25
    xp = base_xp + (streak_count * xp_per_day)
    
    # 최대 보상 제한 (10일차까지: 2800골드, 275XP)
    max_gold = 2800  # 10일차 = 800 + (10 * 200) = 2800
    max_xp = 275     # 10일차 = 25 + (10 * 25) = 275
    
    return min(gold, max_gold), min(xp, max_xp)


def update_user_level_and_streak(db: Session, user_id: int, streak_increment: int = 1) -> tuple[int, int, int]:
    """사용자 레벨과 연속출석 업데이트
    
    Args:
        db: 데이터베이스 세션
        user_id: 사용자 ID  
        streak_increment: 연속출석 증가값 (기본 1)
    
    Returns:
        tuple[int, int, int]: (새로운 레벨, 새로운 연속출석, 추가된 경험치)
    """
    try:
        from app.models.auth_models import User
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return 0, 0, 0
        
        # 연속출석 업데이트
        user.daily_streak += streak_increment
        
        # 연속출석에 따른 경험치 계산 (연속출석 1일당 50 XP)
        bonus_xp = streak_increment * 50
        user.experience_points += bonus_xp
        
        # 레벨 계산 (500 XP마다 레벨업)
        new_level = (user.experience_points // 500) + 1
        old_level = user.level
        user.level = new_level
        
        db.commit()
        
        return new_level, user.daily_streak, bonus_xp
        
    except Exception as e:
        import logging
        logging.error(f"레벨/연속출석 업데이트 실패: {e}")
        db.rollback()
        return 0, 0, 0


def calculate_level_from_streak(daily_streak: int) -> int:
    """연속출석 일수를 기반으로 레벨 계산
    
    레벨 공식: Level = 1 + (daily_streak // 7)
    - 7일 연속출석마다 레벨업
    - 최대 레벨 10 (70일차)
    
    Args:
        daily_streak: 연속 출석 일수
    Returns:
        int: 계산된 레벨 (1-10)
    """
    level = 1 + (daily_streak // 7)
    return min(level, 10)  # 최대 레벨 10

__all__ = ["calculate_streak_daily_reward", "update_user_level_and_streak"]
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app import models
from .token_service import TokenService

class RewardService:
    """Service for handling reward distribution and management"""
    
    def __init__(self, db: Session, token_service: TokenService | None = None):
        self.db = db
        self.token_service = token_service or TokenService(db)

    SINGLE_ADD_COMPAT = True  # 기존 테스트 호환을 위한 최소 플래그 유지

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

    # Fresh grant path within a DB transaction (사이드이펙트 제거 버전)
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

            return {
                "reward_id": reward.id,
                "reward_type": reward.reward_type,
                "reward_value": str(int(reward.value) if reward.value is not None else 0),
                "awarded_at": user_reward.claimed_at,
            }
        except SQLAlchemyError as e:
            self.db.rollback()
            raise e
    # 이메일/브로드캐스트 사이드이펙트 제거 버전: finally 블록 삭제

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
