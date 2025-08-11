from fastapi.testclient import TestClient
from app.main import app
import uuid

client = TestClient(app)


def _signup_and_login():
    # Generate a unique user each run to avoid duplicate signup failures across repeated executions
    suffix = uuid.uuid4().hex[:10]
    site = f"refresh_{suffix}"
    pwd = "1234"
    body = {
        "site_id": site,
        "nickname": site,
        "phone_number": f"0107{suffix[:6]}",
        "invite_code": "5858",
        "password": pwd,
    }
    r = client.post("/api/auth/signup", json=body)
    assert r.status_code in (200, 201)
    login = client.post("/api/auth/login", json={"site_id": site, "password": pwd})
    assert login.status_code == 200
    return login.json()["access_token"]


def test_refresh_with_bearer_then_me():
    token = _signup_and_login()
    r = client.post("/api/auth/refresh", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    new_token = r.json()["access_token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {new_token}"})
    assert me.status_code == 200


def test_refresh_with_body_then_me():
    token = _signup_and_login()
    r = client.post("/api/auth/refresh", json={"refresh_token": token})
    assert r.status_code == 200
    new_token = r.json()["access_token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {new_token}"})
    assert me.status_code == 200
