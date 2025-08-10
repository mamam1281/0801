from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict

from app.core.config import settings
from app.kafka_client import send_kafka_message


router = APIRouter(prefix="/api/kafka", tags=["Kafka"])


class ProduceRequest(BaseModel):
    topic: str
    payload: Dict[str, Any]


@router.get("/health")
def kafka_health():
    """Lightweight health that reflects config; avoids blocking if broker is absent."""
    return {
        "enabled": settings.KAFKA_ENABLED,
        "bootstrap_servers": settings.KAFKA_BOOTSTRAP_SERVERS or None,
        "status": "enabled" if settings.KAFKA_ENABLED else "disabled",
    }


@router.post("/produce")
def kafka_produce(req: ProduceRequest):
    """Produce a message to Kafka if enabled; otherwise 503."""
    if not settings.KAFKA_ENABLED:
        raise HTTPException(status_code=503, detail="Kafka disabled")
    if not (settings.KAFKA_BOOTSTRAP_SERVERS or settings.kafka_bootstrap_servers):
        raise HTTPException(status_code=500, detail="Kafka bootstrap not configured")

    try:
        send_kafka_message(req.topic, req.payload)
        return {"ok": True}
    except Exception as e:
        # Hide internal errors but indicate failure
        raise HTTPException(status_code=502, detail=f"Kafka produce failed: {e}")
