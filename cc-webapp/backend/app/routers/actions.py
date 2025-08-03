import os
import json
from fastapi import APIRouter, Depends, HTTPException
#  # Will be needed later
try:
    from confluent_kafka import Producer
except ImportError:  # In case library is not installed during lightweight tests
    Producer = None
# from .. import models, schemas, database # Assuming these exist and will be used later
from datetime import datetime

router = APIRouter()

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

# Example placeholder for a database session dependency - to be implemented later
# def get_db():
#     db = database.SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

@router.post("/actions", tags=["actions"])
# async def create_action(action: schemas.ActionCreate, db = Depends(get_db)): # Full version with Pydantic and DB
async def create_action(user_id: int, action_type: str): # Simplified for now, matching current subtask request
    """
    Logs an action and publishes it to Kafka.
    For now, this is a simplified stub.
    Replace user_id and action_type with a Pydantic model (e.g., schemas.ActionCreate) later.
    """
    action_timestamp = datetime.utcnow().isoformat()

    # Placeholder for saving to DB - to be implemented later
    # db_action = models.Action(**action.dict(), timestamp=action_timestamp) # Assuming action is Pydantic
    # db.add(db_action)
    # db.commit()
    # db.refresh(db_action)

    payload = {
        "user_id": user_id, # Replace with action.user_id if using Pydantic model
        "action_type": action_type, # Replace with action.action_type
        "action_timestamp": action_timestamp
    }

    if producer:
        try:
            producer.produce(
                TOPIC_USER_ACTIONS,
                key=str(user_id),
                value=json.dumps(payload).encode("utf-8"),
                callback=delivery_report,
            )
            producer.poll(0)
            print(
                f"Produced message to Kafka topic {TOPIC_USER_ACTIONS}: {payload}"
            )
        except BufferError:
            print(
                f"Kafka local queue full ({len(producer)} messages), messages will be dropped."
            )
    else:
        print(f"Kafka disabled - action logged locally: {payload}")
    # producer.flush() # Optional: wait for all messages to be delivered. Can be blocking.

    # return db_action # Or a schema.Action if returning DB object
    return {"message": "Action logged and potentially published to Kafka", "data": payload}

# Ensure this router is included in app/main.py:
# from .routers import actions
# app.include_router(actions.router, prefix="/api", tags=["actions"])
