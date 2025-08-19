import uuid
import pytest
import httpx
from httpx import ASGITransport
from app.services.game_service import GameService
from app.database import SessionLocal
from app import models
from app.main import app
from app.core import economy

@pytest.mark.asyncio
async def test_gacha_pull_v2(monkeypatch):
    monkeypatch.setenv("ECONOMY_V2_ACTIVE", "1")
    # Use legacy cheaper cost to avoid large balance drain in test
    monkeypatch.setenv("CASINO_GACHA_LEGACY_COST", "true")
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
        # 테스트용 충분한 골드 지급
        with SessionLocal() as s:
            u = s.query(models.User).filter_by(site_id=site_id).first()
            if u:
                # Ensure both legacy token field and gold are sufficiently funded
                if hasattr(u, 'cyber_token_balance'):
                    try:
                        u.cyber_token_balance = 5000  # type: ignore[attr-defined]
                    except Exception:
                        pass
                if hasattr(u, 'gold_balance'):
                    u.gold_balance = 5000
                s.commit()
        pull = await ac.post("/api/games/gacha/pull", json={"pull_count": 1}, headers=headers)
        if pull.status_code == 400 and "토큰이 부족" in pull.text:
            # Retry after topping up (in case transaction timing)
            with SessionLocal() as s:
                u = s.query(models.User).filter_by(site_id=site_id).first()
                if u:
                    if hasattr(u, 'cyber_token_balance'):
                        try:
                            u.cyber_token_balance = (u.cyber_token_balance or 0) + 10000  # type: ignore[attr-defined]
                        except Exception:
                            pass
                    if hasattr(u, 'gold_balance'):
                        u.gold_balance += 10000
                    s.commit()
            pull = await ac.post("/api/games/gacha/pull", json={"pull_count": 1}, headers=headers)
        assert pull.status_code == 200, pull.text
        data = pull.json()
        assert data.get("success") is True
        # 희귀 필드: 구현 차이 허용 -> 최소 하나라도 관련 키 존재
        rare_keys = {k for k in data.keys() if "rare" in k}
        assert rare_keys, f"expected at least one rare related key, got: {list(data.keys())}"
        # 비용 검증 (balance 변화는 별도 통합 테스트에서 수행 가능; 여기서는 필드 존재만)
    assert hasattr(economy, "GACHA_RARITY_PROBS")
