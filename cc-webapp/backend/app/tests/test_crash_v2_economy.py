import os
import uuid
import pytest
from httpx import AsyncClient
from app.core.config import settings
from app.main import app

@pytest.mark.asyncio
async def test_crash_bet_v2_flag(monkeypatch):
    # Enable Economy V2
    monkeypatch.setenv("ECONOMY_V2_ACTIVE", "1")
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Create & login helper (assumes helper endpoints exist)
        # Minimal bootstrap: signup then login to obtain token
        username = f"crashv2_{uuid.uuid4().hex[:8]}"
        password = "pass1234"
        nickname = f"CrashV2_{uuid.uuid4().hex[:6]}"
        phone_number = "010" + uuid.uuid4().hex[:9]
        signup_body = {
            "site_id": username,
            "nickname": nickname,
            "phone_number": phone_number,
            "invite_code": "5858",
            "password": password,
        }
        r = await ac.post("/api/auth/signup", json=signup_body)
        assert r.status_code == 200, r.text
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        # Place a crash bet
        bet_resp = await ac.post(
            "/api/games/crash/bet",
            json={"bet_amount": 10, "auto_cashout_multiplier": 2.0},
            headers=headers,
        )
        assert bet_resp.status_code == 200, bet_resp.text
        data = bet_resp.json()
        assert data["success"] is True
        assert data["potential_win"] <= 10 * 2.0
        assert data["potential_win"] >= 10
        assert "max_multiplier" in data
