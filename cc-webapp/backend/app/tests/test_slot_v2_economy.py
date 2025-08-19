import uuid
import pytest
import httpx
from httpx import ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_slot_spin_v2(monkeypatch):
    monkeypatch.setenv("ECONOMY_V2_ACTIVE", "1")
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        site_id = f"slotv2_{uuid.uuid4().hex[:8]}"
        signup_body = {
            "site_id": site_id,
            "nickname": f"SlotV2_{uuid.uuid4().hex[:6]}",
            "phone_number": "010" + uuid.uuid4().hex[:9],
            "invite_code": "5858",
            "password": "pass1234",
        }
        r = await ac.post("/api/auth/signup", json=signup_body)
        assert r.status_code == 200, r.text
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        spin = await ac.post("/api/games/slot/spin", json={"bet": 10}, headers=headers)
        assert spin.status_code == 200, spin.text
        data = spin.json()
        assert data.get("success") is True
        # RTP 조정: 단순 2배 구조라면 potential max <= 2 * bet (economy 적용 후 win_amount 확인)
        win = data.get("win_amount", 0)
        assert win <= 20
