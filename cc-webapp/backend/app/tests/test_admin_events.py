import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta

# conftest.py dependency override 로 모든 요청은 admin 권한 사용자 컨텍스트이므로
# Authorization 헤더/토큰 불필요. 기존 auth_token 경유 로직 제거.


def test_admin_create_event_and_list(client: TestClient):
    payload = {
        "title": "테스트 이벤트 A",
        "description": "설명",
        "event_type": "special",
        "start_date": (datetime.utcnow() - timedelta(minutes=1)).isoformat(),
        "end_date": (datetime.utcnow() + timedelta(days=1)).isoformat(),
        "rewards": {"gold": 100, "exp": 10},
        "requirements": {"model_index_points": 10},
        "image_url": None,
        "priority": 10,
    }
    r = client.post("/api/admin/events/", json=payload)
    assert r.status_code in (200, 201), r.text
    event_id = r.json()["id"]

    r2 = client.get("/api/admin/events/")
    assert r2.status_code == 200
    ids = [e["id"] for e in r2.json()]
    assert event_id in ids


def test_event_join_progress_claim_flow(client: TestClient):
    # 시드 이벤트 생성
    rs = client.post("/api/admin/events/seed/model-index")
    assert rs.status_code == 200
    event = rs.json()
    event_id = event["id"]

    # 참여
    rj = client.post("/api/events/join", json={"event_id": event_id})
    assert rj.status_code == 200, rj.text
    # 진행 업데이트 (요구 progress key 반영)
    rp = client.put(f"/api/events/progress/{event_id}", json={"progress": {"model_index_points": 1000}})
    assert rp.status_code == 200, rp.text
    assert rp.json().get("completed") is True
    # 보상 수령
    rc = client.post(f"/api/events/claim/{event_id}")
    assert rc.status_code == 200, rc.text
    data = rc.json()
    assert data.get("success") is True


def test_force_claim_idempotent_and_duplicate_paths(client: TestClient):
    """멱등 키 재사용 vs 신규 키 중복 호출 경로 검증.

    시나리오:
      A. 동일 키 두 번 → 두 번째는 '재사용' 메시지 & rewards 동일
      B. 다른 키로 재호출(이미 지급 후) → '이미 보상 수령' & 빈 rewards
    """
    rs = client.post("/api/admin/events/seed/model-index")
    event_id = rs.json()["id"]

    # 참여만 (미완료라도 강제 지급 허용)
    client.post("/api/events/join", json={"event_id": event_id})
    user_id = 12345

    idem_key = "force-claim-test-KEY-001"
    r1 = client.post(
        f"/api/admin/events/{event_id}/force-claim/{user_id}",
        headers={"X-Idempotency-Key": idem_key},
    )
    assert r1.status_code == 200, r1.text
    rewards_first = r1.json().get("rewards") or {}
    assert rewards_first, "첫 지급은 rewards 비어 있으면 안 됨"

    r2 = client.post(
        f"/api/admin/events/{event_id}/force-claim/{user_id}",
        headers={"X-Idempotency-Key": idem_key},
    )
    assert r2.status_code == 200
    assert r2.json().get("rewards") == rewards_first
    assert "재사용" in (r2.json().get("message") or "")

    # 새 키로 다시 호출 → 이미 수령 처리 (빈 rewards)
    r3 = client.post(
        f"/api/admin/events/{event_id}/force-claim/{user_id}",
        headers={"X-Idempotency-Key": "force-claim-test-KEY-002"},
    )
    assert r3.status_code == 200
    assert r3.json().get("rewards") == {}
    assert "이미" in (r3.json().get("message") or "")

    # 키 누락 시 400
    r4 = client.post(f"/api/admin/events/{event_id}/force-claim/{user_id}")
    assert r4.status_code == 400


def test_seed_model_index_idempotent(client: TestClient):
    r1 = client.post("/api/admin/events/seed/model-index")
    r2 = client.post("/api/admin/events/seed/model-index")
    assert r1.status_code == 200 and r2.status_code == 200
    assert r1.json()["id"] == r2.json()["id"]
