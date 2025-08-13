"""Mock payment gateway service to simulate charge lifecycle."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Optional
from uuid import uuid4
import random


@dataclass
class PaymentResult:
    success: bool
    status: Literal["authorized", "captured", "failed"]
    charge_id: Optional[str]
    message: str


class PaymentGateway:
    """Very simple mock. Replace with provider SDK later."""

    def authorize(self, amount_cents: int, currency: str = "USD", *, card_token: str | None = None) -> PaymentResult:
        # 90% succeed for demo
        if random.random() < 0.9:
            return PaymentResult(True, "authorized", str(uuid4()), "Authorized")
        return PaymentResult(False, "failed", None, "Card declined")

    def capture(self, charge_id: str) -> PaymentResult:
        # 99% of authorized captures succeed
        if random.random() < 0.99:
            return PaymentResult(True, "captured", charge_id, "Captured")
        return PaymentResult(False, "failed", charge_id, "Capture failed")
