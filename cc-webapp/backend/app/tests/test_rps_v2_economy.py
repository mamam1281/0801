import uuid
import pytest
import httpx
from httpx import ASGITransport
from app.main import app
from app.core import economy

@pytest.mark.asyncio
async def test_rps_play_v2(monkeypatch):
    monkeypatch.setenv("ECONOMY_V2_ACTIVE", "1")
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        site_id = f"rpsv2_{uuid.uuid4().hex[:8]}"
        signup_body = {
            "site_id": site_id,
            "nickname": f"RpsV2_{uuid.uuid4().hex[:6]}",
            "phone_number": "010" + uuid.uuid4().hex[:9],
            "invite_code": "5858",
            "password": "pass1234",
        }
        r = await ac.post("/api/auth/signup", json=signup_body)
        assert r.status_code == 200, r.text
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        play = await ac.post("/api/games/rps/play", json={"bet": 10, "player_move": "rock"}, headers=headers)
        assert play.status_code == 200, play.text
        data = play.json()
        assert data.get("success") is True
        assert data.get("outcome") in {"win","lose","draw"}
        # house edge 기준 상수 접근 확인 (단순 존재 검사)
        assert hasattr(economy, "RPS_HOUSE_EDGE")
