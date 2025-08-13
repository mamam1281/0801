import os
import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from ..database import get_db
from .. import models
from ..schemas.actions import ActionCreate, ActionBatchCreate, ActionResponse

# Optional Kafka producer
try:
    from confluent_kafka import Producer  # type: ignore
except ImportError:
    Producer = None

router = APIRouter(prefix="/api/actions", tags=["Game Actions"])

# Kafka Producer Configuration
KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9092")
KAFKA_ENABLED = os.getenv("KAFKA_ENABLED", "0") == "1"
conf = {"bootstrap.servers": KAFKA_BROKER}
producer = None
if KAFKA_ENABLED and Producer is not None:
    try:
        producer = Producer(conf)
    except Exception as e:
        print(f"Kafka producer init failed: {e}")
        producer = None
TOPIC_USER_ACTIONS = "topic_user_actions"

def delivery_report(err, msg):
    """ Called once for each message produced to indicate delivery result.
        Triggered by poll() or flush(). """
    if err is not None:
        print(f'Message delivery failed: {err}')
    else:
        print(f'Message delivered to {msg.topic()} [{msg.partition()}] at offset {msg.offset()}')

SENSITIVE_KEYS = {"password", "pass", "pwd", "ssn", "phone", "phone_number", "email"}

def _sanitize_context(ctx: Dict[str, Any] | None) -> Dict[str, Any] | None:
    if not ctx:
        return None
    sanitized: Dict[str, Any] = {}
    for k, v in ctx.items():
        lk = str(k).lower()
        if lk in SENSITIVE_KEYS or lk.endswith("_token") or lk.endswith("_secret"):
            sanitized[k] = "***"
        else:
            sanitized[k] = v
    return sanitized

@router.post("", response_model=ActionResponse)
async def create_action(action: ActionCreate, db: Session = Depends(get_db)):
    """Create a single action record and optionally publish to Kafka."""
    ctx = _sanitize_context(action.context)
    # Persist
    db_action = models.UserAction(
        user_id=action.user_id,
        action_type=action.action_type,
        action_data=json.dumps({"context": ctx, "timestamp": (action.timestamp or datetime.utcnow()).isoformat()})
    )
    db.add(db_action)
    db.commit()
    db.refresh(db_action)

    # Kafka publish (best-effort)
    payload = {
        "id": db_action.id,
        "user_id": action.user_id,
        "action_type": action.action_type,
        "timestamp": action.timestamp.isoformat() if action.timestamp else db_action.created_at.isoformat(),
        "context": ctx,
    }
    if producer:
        try:
            producer.produce(
                TOPIC_USER_ACTIONS,
                key=str(action.user_id),
                value=json.dumps(payload).encode("utf-8"),
                callback=delivery_report,
            )
            producer.poll(0)
        except Exception as e:
            print(f"Kafka publish failed: {e}")
    return db_action


@router.post("/batch")
async def create_actions_batch(batch: ActionBatchCreate, db: Session = Depends(get_db)):
    """Bulk insert actions. Returns count inserted."""
    objs: List[models.UserAction] = []
    now = datetime.utcnow()
    for a in batch.actions:
        ctx = _sanitize_context(a.context)
        objs.append(
            models.UserAction(
                user_id=a.user_id,
                action_type=a.action_type,
                action_data=json.dumps({"context": ctx, "timestamp": (a.timestamp or now).isoformat()})
            )
        )
    if not objs:
        return {"inserted": 0}
    db.bulk_save_objects(objs)
    db.commit()
    # Optional: do not publish Kafka per-item for batch to avoid spam
    return {"inserted": len(objs)}

# Ensure this router is included in app/main.py:
# from .routers import actions
# app.include_router(actions.router, prefix="/api", tags=["actions"])
