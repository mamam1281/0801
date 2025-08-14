import json
import time
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_and_docs_exist():
    r = client.get('/health')
    assert r.status_code in (200, 204)
    r = client.get('/docs')
    assert r.status_code == 200


def test_notifications_rest_push_list_read():
    user_id = 98765
    # push
    r = client.post('/api/notifications/push', json={
        'user_id': user_id,
        'title': 'Smoke',
        'message': 'runtime',
        'notification_type': 'info',
        'topic': 'notif',
    })
    assert r.status_code == 200
    nid = r.json().get('id')
    assert nid

    # list
    r2 = client.get(f'/api/notifications/list?user_id={user_id}')
    assert r2.status_code == 200
    items = r2.json()
    assert any(i.get('message') == 'runtime' for i in items)

    # read
    r3 = client.post(f'/api/notifications/read/{nid}')
    assert r3.status_code == 200


def test_ws_receive_enqueued_message():
    user_id = 11223
    with client.websocket_connect(f"/ws/notifications/{user_id}"):
        time.sleep(0.05)
        r = client.post('/api/notifications/push', json={
            'user_id': user_id,
            'title': 'WS',
            'message': 'hello-ws',
            'notification_type': 'info',
            'topic': 'notif',
        })
        assert r.status_code == 200
        time.sleep(0.05)
    r2 = client.get(f"/api/notifications/list?user_id={user_id}")
    assert r2.status_code == 200
    assert any(i.get('message') == 'hello-ws' for i in r2.json())
