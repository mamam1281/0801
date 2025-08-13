from __future__ import annotations

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class LimitedPackageOut(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    price_cents: int
    gems: int = Field(0, description="Number of premium gems granted")
    start_at: datetime
    end_at: datetime
    is_active: bool
    per_user_limit: int = 1
    remaining_stock: Optional[int] = Field(None, description="None means unlimited")
    user_purchased: int = 0
    user_remaining: Optional[int] = None


class LimitedBuyRequest(BaseModel):
    user_id: int
    code: str = Field(..., description="Limited package code")
    quantity: int = Field(1, ge=1, le=10)
    currency: str = Field("USD")
    card_token: Optional[str] = None
    promo_code: Optional[str] = Field(None, description="Optional promotion code for discount")


class LimitedBuyReceipt(BaseModel):
    success: bool
    message: str
    user_id: int
    code: str
    quantity: int
    total_price_cents: int
    gems_granted: int
    new_gem_balance: int
    charge_id: Optional[str] = None
