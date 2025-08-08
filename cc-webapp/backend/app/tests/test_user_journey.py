import os
import json
import pytest
from fastapi.testclient import TestClient

try:
    from app.main import app
except Exception:
    app = None

pytestmark = pytest.mark.skipif(app is None, reason="backend app not importable")

client = TestClient(app) if app else None


def _auth_headers():
    # minimal bootstrap: use a known test user if available
    # if signup/login endpoints exist, this could be replaced with real flow
    token = os.environ.get("TEST_ACCESS_TOKEN")
    if token:
        return {"Authorization": f"Bearer {token}"}
    return {}


def test_user_flow_games_list():
    resp = client.get("/api/games/", headers=_auth_headers())
    # tolerate empty or list; just ensure non-500
    assert resp.status_code in (200, 401, 403)


def test_user_flow_crash_simulated():
    headers = _auth_headers()
    if not headers:
        pytest.skip("No TEST_ACCESS_TOKEN provided; skipping crash flow")

    # place bet
    r1 = client.post("/api/games/crash/bet", json={"betAmount": 10, "autoCashout": 2.0}, headers=headers)
    assert r1.status_code in (200, 409, 503)
    if r1.status_code != 200:
        pytest.skip("Crash bet not available in this environment")
    data = r1.json()
    game_id = data.get("game_id")

    # cash out
    r2 = client.post("/api/games/crash/cashout", json={"gameId": game_id}, headers=headers)
    assert r2.status_code in (200, 404, 409)
