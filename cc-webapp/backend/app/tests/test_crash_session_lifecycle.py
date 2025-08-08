import pytest
from httpx import Client

BASE = "http://localhost:8000"

@pytest.mark.order(1)
def test_crash_lifecycle_requires_auth():
    # Without auth should be 401/403, but must not 5xx
    r = Client().post(f"{BASE}/api/games/crash/bet", json={"betAmount": 10})
    assert r.status_code in (401, 403)

@pytest.mark.order(2)
@pytest.mark.integration
def test_crash_lifecycle_happy_path():
    # This test assumes a running backend and a valid token; adjust if a fixture is available.
    # If token isn't available in CI, skip.
    import os
    token = os.getenv('TEST_USER_TOKEN')
    if not token:
        pytest.skip("TEST_USER_TOKEN not set")

    headers = {"Authorization": f"Bearer {token}"}

    # 1) Bet
    r1 = Client().post(f"{BASE}/api/games/crash/bet", json={"betAmount": 10}, headers=headers)
    assert r1.status_code in (200, 409, 503)
    if r1.status_code != 200:
        pytest.skip("Crash session service not available or already active")
    data1 = r1.json()
    game_id = data1["game_id"]

    # 2) Cashout
    r2 = Client().post(f"{BASE}/api/games/crash/cashout", json={"gameId": game_id}, headers=headers)
    assert r2.status_code == 200
    data2 = r2.json()
    assert data2["success"] is True
    assert data2["game_id"] == game_id
    assert "win_amount" in data2
