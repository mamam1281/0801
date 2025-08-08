import os
import json
import pytest
import httpx

BASE = os.getenv("TEST_BASE_URL", "http://localhost:8000")


def test_health_endpoint_ok():
    r = httpx.get(f"{BASE}/health", timeout=5.0)
    assert r.status_code == 200
    data = r.json()
    assert data.get('status') in ('ok', 'OK', 'healthy', True)


def test_auth_refresh_body_mode_handles_missing_token_gracefully():
    # Without any prior login, body refresh should return 401/400 style error, not 500
    r = httpx.post(f"{BASE}/api/auth/refresh", json={"refresh_token": "invalid_or_missing"}, timeout=5.0)
    assert r.status_code in (400, 401, 403)


def test_auth_refresh_header_mode_handles_missing_token_gracefully():
    # Missing/invalid Authorization header should not 500
    r = httpx.post(f"{BASE}/api/auth/refresh", headers={"Authorization": "Bearer invalid"}, timeout=5.0)
    assert r.status_code in (400, 401, 403)


def test_crash_cashout_requires_body_and_auth():
    # No body provided
    r = httpx.post(f"{BASE}/api/games/crash/cashout", json={}, timeout=5.0)
    # Expect validation error or unauthorized (422/400/401)
    assert r.status_code in (400, 401, 403, 422)

    # Without auth but with a dummy gameId
    r2 = httpx.post(f"{BASE}/api/games/crash/cashout", json={"gameId": "dummy"}, timeout=5.0)
    assert r2.status_code in (400, 401, 403, 422)
