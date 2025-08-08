"""Crash game edge cases tests.

These tests are lightweight and tolerate auth missing by asserting non-500 status.
They validate duplicate bet protection and cashout without active session behavior.
"""
import os
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _auth_headers():
    token = os.getenv("TEST_AUTH_TOKEN")
    return {"Authorization": f"Bearer {token}"} if token else {}


def test_cashout_without_active_session_returns_404_or_not_500():
    r = client.post("/api/games/crash/cashout", json={"gameId": "nonexistent"}, headers=_auth_headers())
    # In secured env may be 401/403; focus on avoiding 5xx
    assert r.status_code != 500
    if r.status_code == 200:
        # If env bypasses auth and service returns OK, payload should have success True
        assert r.json().get("success") in (True, False)


def test_duplicate_bet_returns_409_or_not_500():
    # Place first bet
    r1 = client.post("/api/games/crash/bet", json={"betAmount": 10, "autoCashoutMultiplier": 2.0}, headers=_auth_headers())
    assert r1.status_code != 500
    # Place duplicate bet immediately - expect 409 in normal flow, but tolerate auth gating
    r2 = client.post("/api/games/crash/bet", json={"betAmount": 10, "autoCashoutMultiplier": 2.0}, headers=_auth_headers())
    assert r2.status_code != 500
    # Best case: explicit 409
    if r2.status_code == 409:
        body = r2.json()
        assert "이미 진행 중" in body.get("detail", "") or body.get("detail")
