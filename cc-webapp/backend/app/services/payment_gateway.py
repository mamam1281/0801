"""Simple, configurable Payment Gateway adapter.

This adapter simulates an external payment provider for development/testing.
Behavior is controlled via environment-backed settings in core.config.Settings.

Modes:
- always_success: All payments succeed immediately.
- always_fail: All payments fail immediately.
- pending_then_success: First attempt returns pending, subsequent check returns success.
- random: Randomize success/failure (biased to success).

Refunds:
- Simulated to succeed unless mode is always_fail.
"""

from __future__ import annotations

import os
import random
import time
import uuid
from typing import Dict, Any, Literal, Optional


PaymentStatus = Literal["success", "failed", "pending"]


class PaymentGatewayService:
    def __init__(self, *, mode: Optional[str] = None):
        # Read mode from env if not provided
        self.mode = mode or os.getenv("PAYMENT_GATEWAY_MODE", "always_success").strip()
        # In-memory store for pending states (dev only) - shared across instances
        global _PENDING_STORE
        try:
            _PENDING_STORE  # type: ignore[name-defined]
        except NameError:
            _PENDING_STORE = {}
        self._pending = _PENDING_STORE  # type: ignore[assignment]

    def process_payment(self, *, amount: int, method: Optional[str], metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Initiate a payment and return status, gateway_reference, and message."""
        gateway_ref = uuid.uuid4().hex[:18]
        mode = self.mode
        status: PaymentStatus
        message = ""

        if mode == "always_success":
            status = "success"
            message = "Payment approved"
        elif mode == "always_fail":
            status = "failed"
            message = "Payment declined"
        elif mode == "pending_then_success":
            # First time for this ref: pending, subsequent polls succeed
            status = "pending"
            message = "Payment pending"
            self._pending[gateway_ref] = time.time()
        elif mode == "random":
            status = random.choices(["success", "failed", "pending"], [0.7, 0.2, 0.1])[0]  # type: ignore
            message = {
                "success": "Payment approved",
                "failed": "Payment declined",
                "pending": "Payment pending",
            }[status]
            if status == "pending":
                self._pending[gateway_ref] = time.time()
        else:
            # default safe path
            status = "success"
            message = "Payment approved"

        return {
            "status": status,
            "gateway_reference": gateway_ref,
            "message": message,
        }

    def check_status(self, gateway_reference: str) -> Dict[str, Any]:
        """Poll payment status for a pending reference."""
        if gateway_reference in self._pending:
            # After a small delay, mark as success
            created = self._pending[gateway_reference]
            if time.time() - created > 1.0:
                del self._pending[gateway_reference]
                return {"status": "success", "gateway_reference": gateway_reference}
            return {"status": "pending", "gateway_reference": gateway_reference}
        # Unknown references treated as failed
        return {"status": "failed", "gateway_reference": gateway_reference}

    def refund(self, *, gateway_reference: str, amount: int, reason: Optional[str] = None) -> Dict[str, Any]:
        """Refund a previous charge. Succeeds unless mode is always_fail."""
        if self.mode == "always_fail":
            return {"success": False, "message": "Gateway refund failed"}
        return {"success": True, "message": "Refund processed"}
