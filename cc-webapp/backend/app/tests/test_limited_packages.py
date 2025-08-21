import uuid
import pytest
from fastapi.testclient import TestClient
from app.services.limited_package_service import LimitedPackageService
from app.utils.redis import get_redis_manager


def _reset_limited_state():
    # Clear in-memory service state to avoid cross-test contamination
    LimitedPackageService._catalog.clear()  # noqa: SLF001
    LimitedPackageService._user_purchases.clear()  # noqa: SLF001
    LimitedPackageService._promo_discounts.clear()  # noqa: SLF001
    LimitedPackageService._promo_max_uses.clear()  # noqa: SLF001
    LimitedPackageService._promo_used_count.clear()  # noqa: SLF001
    LimitedPackageService._stock_counts.clear()  # noqa: SLF001
    LimitedPackageService._holds_mem.clear()  # noqa: SLF001
    # Clear Redis keys for limited packages & rate limits
    try:
        rm = get_redis_manager()
        rc = rm.redis_client
        if rc:
            # Use scan to avoid blocking
            cursor = 0
            # Include per-user purchased counters explicitly (limited:* already matches but keep explicit for clarity)
            patterns = [
                "limited:*",
                "rl:buy-limited:*",
                "shop:limited:idemp:*",
                "shop:limited:idemp_lock:*",
                # safety explicit patterns (documented)
                "limited:*:user:*:purchased",
            ]
            for pat in patterns:
                cursor = 0
                while True:
                    cursor, keys = rc.scan(cursor=cursor, match=pat, count=100)
                    if keys:
                        rc.delete(*keys)
                    if cursor == 0:
                        break
    except Exception:
        pass


def signup_and_login(client: TestClient, site_id: str, password: str) -> str:
    # Longer random site ids reduce collision with existing users (password mismatch risk)
    resp_signup = client.post(
        "/api/auth/signup",
        json={
            "site_id": site_id,
            "nickname": f"nick_{site_id}",
            "password": password,
            "invite_code": "5858",
            # numeric unique phone number
            "phone_number": "010" + str(abs(hash(site_id)) % 1_000_000_000).zfill(9),
        },
    )
    assert resp_signup.status_code in (200, 201), f"signup failed: {resp_signup.status_code} {resp_signup.text}"
    r = client.post("/api/auth/login", json={"site_id": site_id, "password": password})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


def ensure_admin(client: TestClient, site_id: str | None = None) -> str:
    # Generate unique admin site id each call to avoid duplicate signup collisions across test reruns
    if site_id is None:
        site_id = "admin_lpkg_" + uuid.uuid4().hex[:8]
    token = signup_and_login(client, site_id, "passw0rd!")
    client.post("/api/admin/users/elevate", json={"site_id": site_id})  # ignore failure in locked env
    return token


def test_limited_package_flow(client: TestClient):
    _reset_limited_state()
    # Deterministic payment behavior provided by session-scoped fixture in conftest (global patch)
    admin = ensure_admin(client)
    ah = {"Authorization": f"Bearer {admin}"}

    pkg_id = "LPKG-TEST-" + uuid.uuid4().hex[:6]
    up = client.post(
        "/api/admin/limited-packages/upsert",
        json={
            "package_id": pkg_id,
            "name": "Starter Pack",
            "description": "Intro pack",
            "price": 50,
            "stock_total": 2,
            "stock_remaining": 2,
            "per_user_limit": 1,
            "is_active": True,
            "contents": {"bonus_tokens": 10},
        },
        headers=ah,
    )
    if up.status_code == 403:
        pytest.skip("Admin guard enforced; skipping admin-limited tests")
    assert up.status_code == 200

    # List should include package
    lr = client.get("/api/shop/limited-packages", headers=ah)
    assert lr.status_code == 200
    assert any(p["package_id"] == pkg_id for p in lr.json())

    # Buyer 1
    u1 = signup_and_login(client, "buyer1-" + uuid.uuid4().hex[:12], "passw0rd!")
    h1 = {"Authorization": f"Bearer {u1}"}
    # self top-up tokens if endpoint exists (non-fatal)
    client.post("/api/users/tokens/add", headers=h1, params={"amount": 500})

    b1 = client.post("/api/shop/buy-limited", json={"package_id": pkg_id}, headers=h1)
    assert b1.status_code == 200, b1.text
    body1 = b1.json()
    assert body1.get("success") is True, body1
    assert body1.get("receipt_code")

    # user_id 수집 (충돌 감지) - buyer1
    me1 = client.get("/api/auth/me", headers=h1)
    assert me1.status_code == 200, f"/api/auth/me failed for buyer1: {me1.status_code} {me1.text}"
    uid1 = me1.json().get("id")
    assert uid1 is not None, "buyer1 user id missing"

    # Second attempt by same user hits per-user limit=1
    b2 = client.post("/api/shop/buy-limited", json={"package_id": pkg_id}, headers=h1)
    assert b2.status_code == 200
    assert b2.json().get("success") is False

    # Remaining stock should be 1 -> second distinct user depletes
    u2 = signup_and_login(client, "buyer2-" + uuid.uuid4().hex[:12], "passw0rd!")
    h2 = {"Authorization": f"Bearer {u2}"}
    client.post("/api/users/tokens/add", headers=h2, params={"amount": 500})
    me2 = client.get("/api/auth/me", headers=h2)
    assert me2.status_code == 200, f"/api/auth/me failed for buyer2: {me2.status_code} {me2.text}"
    uid2 = me2.json().get("id")
    assert uid2 is not None, "buyer2 user id missing"
    assert uid1 != uid2, f"user_id collision detected uid={uid1}; sequence reset 또는 테스트 데이터 누수 가능성"
    b3 = client.post("/api/shop/buy-limited", json={"package_id": pkg_id}, headers=h2)
    assert b3.status_code == 200 and b3.json().get("success") is True

    # Third user sees out of stock
    u3 = signup_and_login(client, "buyer3-" + uuid.uuid4().hex[:12], "passw0rd!")
    h3 = {"Authorization": f"Bearer {u3}"}
    client.post("/api/users/tokens/add", headers=h3, params={"amount": 500})
    me3 = client.get("/api/auth/me", headers=h3)
    assert me3.status_code == 200, f"/api/auth/me failed for buyer3: {me3.status_code} {me3.text}"
    uid3 = me3.json().get("id")
    assert uid3 is not None, "buyer3 user id missing"
    assert uid3 not in {uid1, uid2}, f"user_id collision detected uid={uid3}; sequence reset 또는 테스트 데이터 누수 가능성"
    b4 = client.post("/api/shop/buy-limited", json={"package_id": pkg_id}, headers=h3)
    assert b4.status_code == 200 and b4.json().get("success") is False
    assert "stock" in (b4.json().get("message", "").lower())

    # Disable then ensure blocked
    dis = client.post(f"/api/admin/limited-packages/{pkg_id}/disable", headers=ah)
    assert dis.status_code == 200
    b5 = client.post("/api/shop/buy-limited", json={"package_id": pkg_id}, headers=h3)
    assert b5.status_code == 200 and b5.json().get("success") is False
