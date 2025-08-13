import logging
from typing import List, Dict, Any
import requests
from app.core.config import settings

log = logging.getLogger(__name__)

class ClickHouseClient:
    def __init__(self):
        self.base = settings.CLICKHOUSE_URL.rstrip("/")
        self.db = settings.CLICKHOUSE_DATABASE
        self.params = {}
        if settings.CLICKHOUSE_USER:
            self.params["user"] = settings.CLICKHOUSE_USER
        if settings.CLICKHOUSE_PASSWORD:
            self.params["password"] = settings.CLICKHOUSE_PASSWORD

    def execute(self, sql: str) -> str:
        r = requests.post(
            f"{self.base}/?database={self.db}",
            params=self.params,
            data=sql.encode("utf-8"),
            timeout=10,
        )
        r.raise_for_status()
        return r.text

    def init_schema(self):
        self.execute(f"CREATE DATABASE IF NOT EXISTS {self.db}")
        self.execute("""
        CREATE TABLE IF NOT EXISTS user_actions (
            user_id Int32,
            action_type LowCardinality(String),
            client_ts DateTime64(3) DEFAULT now(),
            server_ts DateTime64(3) DEFAULT now(),
            context_json String CODEC(ZSTD),
            day Date DEFAULT today()
        ) ENGINE = MergeTree()
        PARTITION BY toYYYYMM(day)
        ORDER BY (day, user_id, action_type)
        """)
        self.execute("""
        CREATE TABLE IF NOT EXISTS rewards (
            user_id Int32,
            reward_type LowCardinality(String),
            reward_value Int64,
            source LowCardinality(String),
            awarded_at DateTime64(3) DEFAULT now(),
            day Date DEFAULT today()
        ) ENGINE = MergeTree()
        PARTITION BY toYYYYMM(day)
        ORDER BY (day, user_id, reward_type)
        """)

    def insert_actions(self, rows: List[Dict[str, Any]]):
        if not rows:
            return
        data = "\n".join("\t".join([
            str(int(r.get("user_id") or 0)),
            str(r.get("action_type") or ""),
            str(r.get("client_ts") or ""),
            str(r.get("server_ts") or ""),
            str(r.get("context_json") or "{}"),
        ]) for r in rows)
        sql = "INSERT INTO user_actions (user_id, action_type, client_ts, server_ts, context_json) FORMAT TSV\n" + data
        self.execute(sql)

    def insert_rewards(self, rows: List[Dict[str, Any]]):
        if not rows:
            return
        data = "\n".join("\t".join([
            str(int(r.get("user_id") or 0)),
            str(r.get("reward_type") or ""),
            str(int(r.get("reward_value") or 0)),
            str(r.get("source") or ""),
            str(r.get("awarded_at") or ""),
        ]) for r in rows)
        sql = "INSERT INTO rewards (user_id, reward_type, reward_value, source, awarded_at) FORMAT TSV\n" + data
        self.execute(sql)