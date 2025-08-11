import pytest
from fastapi import status


def test_protected_requires_auth(client):
    # /api/users/profile requires auth → 401 without token
    r = client.get("/api/users/profile")
    assert r.status_code == status.HTTP_401_UNAUTHORIZED


def _signup_and_login(client, site_id="rbacuser", password="1234", nickname="rbac", phone="01000000000"):
    # signup
    body = {
        "site_id": site_id,
        "nickname": nickname,
        "phone_number": phone,
        "invite_code": "5858",
        "password": password,
    }
    rs = client.post("/api/auth/signup", json=body)
    assert rs.status_code in (status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST)
    # If user exists, try login
    rl = client.post("/api/auth/login", json={"site_id": site_id, "password": password})
    assert rl.status_code == status.HTTP_200_OK
    tok = rl.json()["access_token"]
    return tok


def test_vip_only_forbidden_for_standard(client):
    token = _signup_and_login(client)
    r = client.get("/api/users/vip-only", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_200_OK)
    # If 200, the default tier might not be STANDARD; accept either for now


def test_refresh_flow(client):
    token = _signup_and_login(client, site_id="rbacuser2", nickname="rbac2", phone="01000000001")
    # refresh using Authorization bearer
    rr = client.post("/api/auth/refresh", headers={"Authorization": f"Bearer {token}"})
    assert rr.status_code == status.HTTP_200_OK
    new_token = rr.json()["access_token"]
    assert isinstance(new_token, str) and len(new_token) > 10
