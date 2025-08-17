"""이원화 통화(Coins/Gems) 관리 서비스

SELECT FOR UPDATE 기반 원자적 잔액 변경 제공.
기존 cyber_token_balance 는 향후 deprecated 예정이며 premium_gem_balance 로 이동.
"""
from __future__ import annotations
from typing import Optional, Literal
from sqlalchemy.orm import Session
from sqlalchemy import select, update, text
from sqlalchemy.exc import SQLAlchemyError
from app.models.auth_models import User
import logging

logger = logging.getLogger(__name__)

CurrencyType = Literal['coin','gem']

class InsufficientBalanceError(Exception):
    def __init__(self, currency: str, required: int, current: int):
        super().__init__(f"Insufficient {currency} balance: required={required}, current={current}")
        self.currency = currency
        self.required = required
        self.current = current

class CurrencyService:
    def __init__(self, db: Session):
        self.db = db

    def _get_user_for_update(self, user_id: int) -> Optional[User]:
        # DB-agnostic 방식: ORM refresh with FOR UPDATE (raw SQL)
        try:
            return self.db.execute(
                select(User).where(User.id == user_id).with_for_update()
            ).scalar_one_or_none()
        except Exception as e:
            logger.error(f"Lock user failed user_id={user_id}: {e}")
            return None

    def _apply_delta(self, user: User, currency: CurrencyType, delta: int) -> int:
        if currency == 'coin':
            current = getattr(user, 'regular_coin_balance', 0) or 0
            new_val = current + delta
            if new_val < 0:
                raise InsufficientBalanceError('coin', -delta, current)
            user.regular_coin_balance = new_val
            return new_val
        else:
            # gem
            # 우선 premium_gem_balance 우선, legacy cyber_token_balance 동기화 선택적(여기선 독립)
            current = getattr(user, 'premium_gem_balance', 0) or 0
            new_val = current + delta
            if new_val < 0:
                raise InsufficientBalanceError('gem', -delta, current)
            user.premium_gem_balance = new_val
            return new_val

    def add(self, user_id: int, amount: int, currency: CurrencyType) -> int:
        if amount < 0:
            raise ValueError('amount must be >=0')
        user = self._get_user_for_update(user_id)
        if not user:
            raise ValueError('user not found')
        new_val = self._apply_delta(user, currency, amount)
        self.db.commit()
        return new_val

    def deduct(self, user_id: int, amount: int, currency: CurrencyType) -> int:
        if amount < 0:
            raise ValueError('amount must be >=0')
        user = self._get_user_for_update(user_id)
        if not user:
            raise ValueError('user not found')
        new_val = self._apply_delta(user, currency, -amount)
        self.db.commit()
        return new_val

    def transfer_legacy_tokens_to_gems(self, user_id: int) -> int:
        """옵션: 기존 cyber_token_balance 를 premium_gem_balance 로 1:1 이전(1회성 마이그레이션 시 사용)."""
        user = self._get_user_for_update(user_id)
        if not user:
            raise ValueError('user not found')
        legacy = getattr(user, 'cyber_token_balance', 0) or 0
        if legacy <= 0:
            return user.premium_gem_balance or 0
        user.premium_gem_balance = (user.premium_gem_balance or 0) + legacy
        user.cyber_token_balance = 0  # zero out legacy
        self.db.commit()
        return user.premium_gem_balance or 0

    def get_balances(self, user_id: int) -> dict:
        user = self.db.get(User, user_id)
        if not user:
            raise ValueError('user not found')
        return {
            'coin': getattr(user, 'regular_coin_balance', 0) or 0,
            'gem': getattr(user, 'premium_gem_balance', 0) or 0,
            'legacy_token': getattr(user, 'cyber_token_balance', 0) or 0,
        }
