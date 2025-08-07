"""
Kafka Producer/Consumer integration for FastAPI backend.
- Uses kafka-python (already installed)
- Loads config from app.config
- Provides reusable producer and consumer utilities
"""
import json
from kafka import KafkaProducer, KafkaConsumer
from app.config import settings

KAFKA_BOOTSTRAP_SERVERS = settings.kafka_bootstrap_servers

# --- Producer (Lazy Loading) ---
_producer = None

def get_kafka_producer():
    """Get or create Kafka producer with lazy loading."""
    global _producer
    if _producer is None:
        _producer = KafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            acks='all',
            linger_ms=10,
        )
    return _producer

def send_kafka_message(topic: str, value: dict) -> None:
    """Send a message to a Kafka topic."""
    try:
        producer = get_kafka_producer()
        producer.send(topic, value=value)
        producer.flush()
    except Exception as e:
        # Log error but don't crash the application
        print(f"Failed to send Kafka message: {e}")
        # In production, use proper logging

# --- Consumer (for background tasks or CLI scripts) ---
def get_kafka_consumer(topic: str, group_id: str = None) -> KafkaConsumer:
    """Get a Kafka consumer for a topic."""
    return KafkaConsumer(
        topic,
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        group_id=group_id,
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
        auto_offset_reset='earliest',
        enable_auto_commit=True,
    )
