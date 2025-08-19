import uuid
import pytest
import httpx
from httpx import ASGITransport
from app.main import app
from app.core import economy

@pytest.mark.asyncio
async def test_gacha_pull_v2(monkeypatch):
    monkeypatch.setenv("ECONOMY_V2_ACTIVE", "1")
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        site_id = f"gachav2_{uuid.uuid4().hex[:8]}"
        signup_body = {
            "site_id": site_id,
            "nickname": f"GachaV2_{uuid.uuid4().hex[:6]}",
            "phone_number": "010" + uuid.uuid4().hex[:9],
            "invite_code": "5858",
            "password": "pass1234",
        }
        r = await ac.post("/api/auth/signup", json=signup_body)
        assert r.status_code == 200, r.text
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        pull = await ac.post("/api/games/gacha/pull", json={"pull_count": 1}, headers=headers)
        assert pull.status_code == 200, pull.text
        data = pull.json()
        assert data.get("success") is True
        # 희귀 필드 존재 (rare/ultra_rare or animation)
        assert "rare_item_count" in data
        assert "ultra_rare_item_count" in data
        # 비용 검증 (balance 변화는 별도 통합 테스트에서 수행 가능; 여기서는 필드 존재만)
        assert hasattr(economy, "GACHA_RARE_PROBABILITY")
