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
    package_id: str = Field(..., description="Limited package id/code")
    quantity: int = Field(1, ge=1, le=10)
    currency: str = Field("USD")
    card_token: Optional[str] = None
    promo_code: Optional[str] = Field(None, description="Optional promotion code for discount")
    # Optional idempotency key to protect from duplicate charges/retries
    idempotency_key: Optional[str] = Field(None, description="Client-provided idempotency key (unique per purchase attempt)")


class LimitedBuyReceipt(BaseModel):
    success: bool
    message: str
    user_id: int | None = None
    code: Optional[str] = None
    quantity: Optional[int] = None
    total_price_cents: Optional[int] = None
    gems_granted: Optional[int] = None
    new_gem_balance: Optional[int] = None
    charge_id: Optional[str] = None
    receipt_code: Optional[str] = None
    # Optional standardized reason code for failures/UI handling (e.g., OUT_OF_STOCK, USER_LIMIT, WINDOW_CLOSED)
    reason_code: Optional[str] = Field(None, description="Standardized reason code for failure states")
