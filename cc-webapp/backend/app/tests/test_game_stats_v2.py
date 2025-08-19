import uuid
import pytest
from fastapi.testclient import TestClient


def _unique(val: str) -> str:
    return f"{val}_{uuid.uuid4().hex[:6]}"


def test_game_stats_contains_total_gold_won(client: TestClient):
    # signup
    body = {
        "site_id": _unique("statuser"),
        "nickname": _unique("nick"),
    "phone_number": "010" + uuid.uuid4().hex[:9],
        "password": "Passw0rd!",
        "invite_code": "5858"
    }
    r = client.post("/api/auth/signup", json=body)
    assert r.status_code == 200, r.text
    user_id = r.json()["user"]["id"]

    # call stats endpoint
    r2 = client.get(f"/api/games/stats/{user_id}")
    assert r2.status_code == 200, r2.text
    data = r2.json()
    # presence + type
    assert "total_gold_won" in data, data
    assert isinstance(data["total_gold_won"], int)
    # legacy field must not appear
    assert "total_gems_won" not in data
