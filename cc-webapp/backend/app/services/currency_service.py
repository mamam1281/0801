"""단일 통화(cyber_token_balance) 관리 서비스

요구 변경: 이원화(regular_coin_balance / premium_gem_balance) 보류 → 단일 잔액 유지.
외부 호출에서 coin/gem 구분 인자 들어오더라도 모두 동일 잔액(cyber_token_balance)을 참조.
향후 이원화 재도입 시 이 파일을 dual-currency 브랜치로 교체 가능하도록 최소 표면적 유지.
"""
from __future__ import annotations
from typing import Optional, Literal
from sqlalchemy.orm import Session
from sqlalchemy import select, update, text
from sqlalchemy.exc import SQLAlchemyError
from app.models.auth_models import User
import logging

logger = logging.getLogger(__name__)

CurrencyType = Literal['coin','gem','token']  # coin/gem synonym → 단일 token

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
        # 모든 currency 라벨은 cyber_token_balance 하나로 합산
        label = 'token'
        current = getattr(user, 'cyber_token_balance', 0) or 0
        new_val = current + delta
        if new_val < 0:
            raise InsufficientBalanceError(label, -delta, current)
        user.cyber_token_balance = new_val
        # 동시 존재할 수 있는 실험적 컬럼이 남아있다면 동기화(읽기 혼선 감소)
        if hasattr(user, 'regular_coin_balance'):
            try: user.regular_coin_balance = new_val
            except Exception: pass
        if hasattr(user, 'premium_gem_balance'):
            try: user.premium_gem_balance = new_val
            except Exception: pass
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

    def transfer_legacy_tokens_to_gems(self, user_id: int) -> int:  # 유지: 하위호환 (현재 단일 모드에서는 noop)
        user = self._get_user_for_update(user_id)
        if not user:
            raise ValueError('user not found')
        # 단일 통화 모드에서는 premium_gem_balance 사용 안 함. 동기화만 수행.
        val = getattr(user, 'cyber_token_balance', 0) or 0
        if hasattr(user, 'premium_gem_balance'):
            try: user.premium_gem_balance = val
            except Exception: pass
        if hasattr(user, 'regular_coin_balance'):
            try: user.regular_coin_balance = val
            except Exception: pass
        self.db.commit()
        return val

    def get_balances(self, user_id: int) -> dict:
        user = self.db.get(User, user_id)
        if not user:
            raise ValueError('user not found')
        unified = getattr(user, 'cyber_token_balance', 0) or 0
        return {
            'token': unified,
            'coin': unified,  # alias
            'gem': unified,   # alias
        }
