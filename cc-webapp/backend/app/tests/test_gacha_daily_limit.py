import pytest


@pytest.mark.asyncio
async def test_gacha_daily_limit_enforced(auth_token, client):
    token = auth_token()  # fixture returns factory
    headers = {"Authorization": f"Bearer {token}"}

    # 기본 daily limit: STANDARD 3회 (pull_count 생략 → 단일)
    for _ in range(3):
        resp = client.post("/api/games/gacha/pull", json={"pull_count": 1}, headers=headers)
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data.get("success") is True

    # 4번째 시도 → 429 + code DAILY_GACHA_LIMIT
    resp = client.post("/api/games/gacha/pull", json={"pull_count": 1}, headers=headers)
    assert resp.status_code == 429, resp.text
    body = resp.json()
    # FastAPI detail dict 유지 → {"detail": {"code": "DAILY_GACHA_LIMIT", "message": "..."}}
    assert isinstance(body.get("detail"), dict)
    assert body["detail"].get("code") == "DAILY_GACHA_LIMIT"
    assert "일일 가챠" in body["detail"].get("message", "")
