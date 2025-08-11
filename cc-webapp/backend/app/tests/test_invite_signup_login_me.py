import pytest
from fastapi.testclient import TestClient
import uuid

from app.main import app

client = TestClient(app)


def test_check_invite_5858_valid():
    r = client.get("/api/auth/check-invite/5858")
    assert r.status_code == 200
    data = r.json()
    assert data["valid"] is True and data.get("infinite") is True


def test_signup_then_login_and_me_flow():
    # use a unique user per test run to avoid duplicate signup on persistent DB
    suffix = uuid.uuid4().hex[:8]
    user = f"user_flow_{suffix}"
    phone = f"010{suffix[:8]}"
    # signup
    body = {
        "site_id": user,
        "nickname": user,
        "phone_number": phone,
        "invite_code": "5858",
        "password": "1234",
    }
    r = client.post("/api/auth/signup", json=body)
    assert r.status_code in (200, 201)
    tok = r.json()["access_token"]
    # login with same creds
    r2 = client.post("/api/auth/login", json={"site_id": user, "password": "1234"})
    assert r2.status_code == 200
    tok2 = r2.json()["access_token"]

    # /me
    r3 = client.get("/api/auth/me", headers={"Authorization": f"Bearer {tok2}"})
    assert r3.status_code == 200
    me = r3.json()
    assert me["site_id"] == user


def test_login_invalid_credentials():
    r = client.post("/api/auth/login", json={"site_id": "not_exist", "password": "wrong"})
    assert r.status_code == 401
