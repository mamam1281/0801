import json, time, logging
from typing import Dict, List
from kafka import KafkaConsumer
from app.core.config import settings
from app.olap.clickhouse_client import ClickHouseClient

log = logging.getLogger("olap_worker")

def _parse(msg) -> Dict:
    try:
        return json.loads(msg.value.decode("utf-8"))
    except Exception:
        return {}

def run():
    if not (settings.KAFKA_ENABLED and settings.CLICKHOUSE_ENABLED):
        log.warning("OLAP worker disabled (KAFKA=%s, CH=%s)", settings.KAFKA_ENABLED, settings.CLICKHOUSE_ENABLED)
        return

    client = ClickHouseClient()
    client.init_schema()

    topics = [settings.KAFKA_ACTIONS_TOPIC, settings.KAFKA_REWARDS_TOPIC, getattr(settings, "KAFKA_PURCHASES_TOPIC", "buy_package")]
    consumer = KafkaConsumer(
        *topics,
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS.split(","),
        group_id="cc_olap_worker",
        enable_auto_commit=False,
        auto_offset_reset="latest",
        consumer_timeout_ms=1000,
        max_poll_records=1000,
        value_deserializer=lambda v: v,
    )
    log.info("OLAP worker started, topics=%s", topics)

    buf_actions: List[Dict] = []
    buf_rewards: List[Dict] = []
    buf_purchases: List[Dict] = []
    last_flush = time.time()

    def flush():
        nonlocal buf_actions, buf_rewards, last_flush
        if buf_actions:
            client.insert_actions(buf_actions)
            buf_actions = []
        if buf_rewards:
            client.insert_rewards(buf_rewards)
            buf_rewards = []
        if buf_purchases:
            client.insert_purchases(buf_purchases)
            buf_purchases = []
        last_flush = time.time()

    try:
        while True:
            polled = consumer.poll(timeout_ms=500, max_records=500)
            for records in polled.values():
                for m in records:
                    payload = _parse(m)
                    if m.topic == settings.KAFKA_ACTIONS_TOPIC:
                        buf_actions.append({
                            "user_id": payload.get("user_id"),
                            "action_type": payload.get("action_type"),
                            "client_ts": payload.get("client_ts"),
                            "server_ts": payload.get("server_ts"),
                            "context_json": json.dumps(payload.get("context") or {}),
                        })
                    elif m.topic == settings.KAFKA_REWARDS_TOPIC:
                        buf_rewards.append({
                            "user_id": payload.get("user_id"),
                            "reward_type": payload.get("reward_type"),
                            "reward_value": payload.get("reward_value"),
                            "source": payload.get("source"),
                            "awarded_at": payload.get("awarded_at"),
                        })
                    elif m.topic == getattr(settings, "KAFKA_PURCHASES_TOPIC", "buy_package"):
                        buf_purchases.append({
                            "user_id": payload.get("user_id"),
                            "code": payload.get("code"),
                            "quantity": payload.get("quantity"),
                            "total_price_cents": payload.get("total_price_cents"),
                            "gems_granted": payload.get("gems_granted"),
                            "charge_id": payload.get("charge_id"),
                            "purchased_at": payload.get("server_ts"),
                        })
            if (len(buf_actions) + len(buf_rewards) + len(buf_purchases) >= settings.OLAP_BATCH_SIZE) or (time.time() - last_flush >= settings.OLAP_FLUSH_SECONDS):
                flush()
                consumer.commit()
    except KeyboardInterrupt:
        pass
    except Exception as e:
        log.exception("OLAP worker crashed: %s", e)
    finally:
        try:
            flush()
            consumer.commit()
        except Exception:
            pass
        consumer.close()

if __name__ == "__main__":
    run()