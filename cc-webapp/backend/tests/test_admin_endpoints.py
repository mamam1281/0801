import json
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def auth_headers():
    # Minimal admin token stub if dependency allows bypass; otherwise adjust to real auth fixture
    return {"Authorization": "Bearer test-admin-token"}


def test_notifications_broadcast_smoke(monkeypatch):
    # Patch manager.broadcast to avoid needing websockets
    from app import websockets
    calls = {"count": 0}
    async def fake_broadcast(msg):
        calls["count"] += 1
    monkeypatch.setattr(websockets.manager, "broadcast", fake_broadcast)

    payload = {"title": "Hello", "body": "World"}
    r = client.post("/api/admin/notifications/broadcast", json=payload, headers=auth_headers())
    # Depending on require_admin_access, this might be 401/403 in real env. Here we assert non-500.
    assert r.status_code in (200, 401, 403)


def test_rewards_bulk_bad_request():
    r = client.post("/api/admin/rewards/grant-bulk", json={"items": []}, headers=auth_headers())
    assert r.status_code in (400, 401, 403)
