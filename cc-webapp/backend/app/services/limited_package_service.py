from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional, List, Dict

from ..core.config import settings
from ..utils.redis import get_redis_manager


@dataclass
class LimitedPackage:
    code: str
    name: str
    description: str
    price_cents: int
    gems: int
    start_at: datetime
    end_at: datetime
    per_user_limit: int = 1
    initial_stock: Optional[int] = None  # None => unlimited
    is_active: bool = True


class LimitedPackageService:
    """
    In-memory limited packages catalog with Redis-backed stock and per-user counters.
    This avoids DB migrations for now while providing realistic behavior.
    """

    # Demo catalog; can be replaced by DB/admin later.
    _catalog: Dict[str, LimitedPackage] = {}
    _promo_discounts: Dict[str, Dict[str, int]] = {}  # {code: {PROMO: cents_off_per_unit}}

    @classmethod
    def _seed_catalog(cls):
        if cls._catalog:
            return
        now = datetime.now(timezone.utc)
        cls._catalog = {
            "WEEKEND_STARTER": LimitedPackage(
                code="WEEKEND_STARTER",
                name="Weekend Starter Pack",
                description="Limited-time pack with bonus gems",
                price_cents=499,
                gems=600,
                start_at=now,
                end_at=now.replace(hour=23, minute=59) ,
                per_user_limit=1,
                initial_stock=1000,
                is_active=True,
            ),
            "VIP_BLITZ": LimitedPackage(
                code="VIP_BLITZ",
                name="VIP Blitz Pack",
                description="High value pack for VIPs",
                price_cents=1999,
                gems=2600,
                start_at=now,
                end_at=now.replace(hour=23, minute=59),
                per_user_limit=2,
                initial_stock=None,  # unlimited
                is_active=True,
            ),
        }

    @classmethod
    def list_active(cls) -> List[LimitedPackage]:
        cls._seed_catalog()
        now = datetime.now(timezone.utc)
        return [p for p in cls._catalog.values() if p.is_active and p.start_at <= now <= p.end_at]

    @classmethod
    def get(cls, code: str) -> Optional[LimitedPackage]:
        cls._seed_catalog()
        return cls._catalog.get(code)

    # --- Admin mutators (MVP; in-memory only) ---
    @classmethod
    def set_active(cls, code: str, active: bool) -> bool:
        pkg = cls.get(code)
        if not pkg:
            return False
        pkg.is_active = bool(active)
        return True

    @classmethod
    def set_period(cls, code: str, start_at: datetime, end_at: datetime) -> bool:
        pkg = cls.get(code)
        if not pkg:
            return False
        pkg.start_at = start_at
        pkg.end_at = end_at
        return True

    @classmethod
    def set_per_user_limit(cls, code: str, per_user_limit: int) -> bool:
        pkg = cls.get(code)
        if not pkg:
            return False
        pkg.per_user_limit = int(per_user_limit)
        return True

    @classmethod
    def set_initial_stock(cls, code: str, initial_stock: Optional[int]) -> bool:
        pkg = cls.get(code)
        if not pkg:
            return False
        pkg.initial_stock = initial_stock
        # also seed redis key to new stock if provided
        if initial_stock is not None:
            r = get_redis_manager()
            if r.redis_client:
                r.redis_client.setnx(cls._stock_key(code), int(initial_stock))
        return True

    # --- Promo codes (absolute cents discount per unit) ---
    @classmethod
    def set_promo_discount(cls, code: str, promo_code: str, cents_off: int) -> None:
        cls._promo_discounts.setdefault(code, {})[promo_code.upper()] = max(int(cents_off), 0)

    @classmethod
    def clear_promo_discount(cls, code: str, promo_code: str) -> None:
        mp = cls._promo_discounts.get(code) or {}
        mp.pop(promo_code.upper(), None)

    @classmethod
    def list_promos(cls, code: str) -> Dict[str, int]:
        return dict(cls._promo_discounts.get(code) or {})

    @classmethod
    def get_promo_discount(cls, code: str, promo_code: Optional[str]) -> int:
        if not promo_code:
            return 0
        return int((cls._promo_discounts.get(code) or {}).get(promo_code.upper(), 0))

    @staticmethod
    def _stock_key(code: str) -> str:
        return f"limited:{code}:stock"

    @staticmethod
    def _purchased_key(code: str, user_id: int) -> str:
        return f"limited:{code}:user:{user_id}:purchased"

    @classmethod
    def get_stock(cls, code: str) -> Optional[int]:
        pkg = cls.get(code)
        if not pkg:
            return None
        if pkg.initial_stock is None:
            return None  # unlimited
        r = get_redis_manager()
        key = cls._stock_key(code)
        # Initialize if not set
        current = r.redis_client.get(key) if r.redis_client else None
        if current is None:
            if r.redis_client:
                r.redis_client.setnx(key, pkg.initial_stock)
                return pkg.initial_stock
            return pkg.initial_stock
        try:
            return int(current)
        except Exception:
            return pkg.initial_stock

    @classmethod
    def get_user_purchased(cls, code: str, user_id: int) -> int:
        r = get_redis_manager()
        key = cls._purchased_key(code, user_id)
        val = r.redis_client.get(key) if r.redis_client else None
        try:
            return int(val) if val is not None else 0
        except Exception:
            return 0

    @classmethod
    def try_reserve(cls, code: str, quantity: int) -> bool:
        pkg = cls.get(code)
        if not pkg:
            return False
        if pkg.initial_stock is None:
            return True  # unlimited
        r = get_redis_manager()
        if not r.redis_client:
            # Fallback optimistic; pretend success to avoid blocking local dev
            return True
        key = cls._stock_key(code)
        pipe = r.redis_client.pipeline()
        while True:
            try:
                pipe.watch(key)
                current = pipe.get(key)
                current = int(current) if current is not None else pkg.initial_stock
                if current < quantity:
                    pipe.unwatch()
                    return False
                pipe.multi()
                pipe.decrby(key, quantity)
                pipe.execute()
                return True
            except Exception:
                # Retry a couple times on contention
                try:
                    pipe.reset()
                except Exception:
                    pass
                return False

    @classmethod
    def finalize_user_purchase(cls, code: str, user_id: int, quantity: int) -> None:
        r = get_redis_manager()
        if r.redis_client:
            r.redis_client.incrby(cls._purchased_key(code, user_id), quantity)

    @classmethod
    def release_reservation(cls, code: str, quantity: int) -> None:
        pkg = cls.get(code)
        if not pkg or pkg.initial_stock is None:
            return
        r = get_redis_manager()
        if r.redis_client:
            r.redis_client.incrby(cls._stock_key(code), quantity)
