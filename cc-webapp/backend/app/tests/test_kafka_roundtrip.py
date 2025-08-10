import os
import time
import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)
BROKER = os.getenv("KAFKA_BOOTSTRAP_SERVERS") or os.getenv("KAFKA_BROKER")
ENABLED = os.getenv("KAFKA_ENABLED", "0") == "1"


@pytest.mark.skipif(not (BROKER and ENABLED), reason="kafka disabled")
def test_kafka_roundtrip_debug_endpoint():
    topic = os.getenv("KAFKA_TEST_TOPIC", "cc_test")
    marker = str(uuid.uuid4())
    payload = {"marker": marker}
    # Give the consumer a moment to finish startup and partition assignment
    time.sleep(1.0)
    # Produce
    r = client.post("/api/kafka/produce", json={"topic": topic, "payload": payload})
    assert r.status_code in (200, 502)
    # Poll debug endpoint for up to ~30 seconds
    seen = False
    for _ in range(60):
        time.sleep(0.5)
        resp = client.get("/api/kafka/_debug/last?limit=50")
        assert resp.status_code == 200
        items = resp.json().get("items", [])
        if any(i.get("value", {}).get("marker") == marker for i in items):
            seen = True
            break
    assert seen, "produced marker not observed by consumer"
