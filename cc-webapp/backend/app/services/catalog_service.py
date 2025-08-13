"""Simple in-memory shop catalog and pricing/discount policy."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Optional
from datetime import datetime, timedelta


@dataclass(frozen=True)
class Product:
    id: int
    sku: str
    name: str
    # Price in minor currency unit (e.g., cents)
    price_cents: int
    # Gems granted when purchased
    gems: int
    # Optional discount percent (0-100)
    discount_percent: int = 0
    # Optional discount window
    discount_ends_at: Optional[datetime] = None
    # Optional VIP required rank
    min_rank: Optional[str] = None


class CatalogService:
    """A trivial static catalog; replace with DB-backed repo later."""

    # Demo catalog
    _catalog: Dict[int, Product] = {
        1001: Product(id=1001, sku="GEM_PACK_SMALL", name="Gems x100", price_cents=299, gems=100),
        1002: Product(id=1002, sku="GEM_PACK_MED", name="Gems x550", price_cents=1299, gems=550, discount_percent=8),
        1003: Product(id=1003, sku="GEM_PACK_BIG", name="Gems x1200", price_cents=2499, gems=1200, discount_percent=12),
        1004: Product(
            id=1004,
            sku="GEM_PACK_VIP",
            name="Gems x3000 (VIP)",
            price_cents=5999,
            gems=3000,
            discount_percent=15,
            discount_ends_at=datetime.utcnow() + timedelta(days=7),
            min_rank="VIP",
        ),
    }

    @classmethod
    def get_product(cls, product_id: int) -> Optional[Product]:
        return cls._catalog.get(product_id)

    @classmethod
    def list_products(cls) -> list[Product]:
        return list(cls._catalog.values())

    @staticmethod
    def compute_price_cents(product: Product, quantity: int = 1) -> int:
        """Compute discounted total price for the quantity."""
        base = product.price_cents * max(1, quantity)
        disc = product.discount_percent or 0
        if product.discount_ends_at and datetime.utcnow() > product.discount_ends_at:
            disc = 0
        if disc <= 0:
            return base
        # Round down after discount to minor unit
        return int(base * (100 - disc) / 100)
