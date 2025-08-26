import os

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_root_ok():
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body.get("status") == "healthy"


def test_health_api_alias_ok():
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body.get("status") == "healthy"