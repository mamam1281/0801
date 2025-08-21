import uuid
import pytest
from fastapi.testclient import TestClient


def signup_and_login(client: TestClient, site_id: str, password: str) -> str:
    client.post(
        "/api/auth/signup",
        json={
            "site_id": site_id,
            "nickname": f"nick_{site_id}",
            "password": password,
            "invite_code": "5858",
            "phone_number": "010" + site_id[-8:].rjust(8, '0'),
        },
    )
    r = client.post("/api/auth/login", json={"site_id": site_id, "password": password})
    assert r.status_code == 200
    return r.json()["access_token"]


def ensure_admin(client: TestClient, site_id: str = "admin_lpkg") -> str:
    token = signup_and_login(client, site_id, "passw0rd!")
    client.post("/api/admin/users/elevate", json={"site_id": site_id})  # ignore failure in locked env
    return token


def test_limited_package_flow(client: TestClient):
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
    u1 = signup_and_login(client, "buyer1", "passw0rd!")
    h1 = {"Authorization": f"Bearer {u1}"}
    # self top-up tokens if endpoint exists (non-fatal)
    client.post("/api/users/tokens/add", headers=h1, params={"amount": 500})

    b1 = client.post("/api/shop/buy-limited", json={"package_id": pkg_id}, headers=h1)
    assert b1.status_code == 200, b1.text
    body1 = b1.json()
    assert body1.get("success") is True, body1
    assert body1.get("receipt_code")

    # Second attempt by same user hits per-user limit=1
    b2 = client.post("/api/shop/buy-limited", json={"package_id": pkg_id}, headers=h1)
    assert b2.status_code == 200
    assert b2.json().get("success") is False

    # Remaining stock should be 1 -> second distinct user depletes
    u2 = signup_and_login(client, "buyer2", "passw0rd!")
    h2 = {"Authorization": f"Bearer {u2}"}
    client.post("/api/users/tokens/add", headers=h2, params={"amount": 500})
    b3 = client.post("/api/shop/buy-limited", json={"package_id": pkg_id}, headers=h2)
    assert b3.status_code == 200 and b3.json().get("success") is True

    # Third user sees out of stock
    u3 = signup_and_login(client, "buyer3", "passw0rd!")
    h3 = {"Authorization": f"Bearer {u3}"}
    client.post("/api/users/tokens/add", headers=h3, params={"amount": 500})
    b4 = client.post("/api/shop/buy-limited", json={"package_id": pkg_id}, headers=h3)
    assert b4.status_code == 200 and b4.json().get("success") is False
    assert "stock" in (b4.json().get("message", "").lower())

    # Disable then ensure blocked
    dis = client.post(f"/api/admin/limited-packages/{pkg_id}/disable", headers=ah)
    assert dis.status_code == 200
    b5 = client.post("/api/shop/buy-limited", json={"package_id": pkg_id}, headers=h3)
    assert b5.status_code == 200 and b5.json().get("success") is False
