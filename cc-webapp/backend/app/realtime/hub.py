"""간단 인메모리 WebSocket 브로드캐스터 (MVP)

확장 고려 사항 (미구현/주석):
- Redis Pub/Sub 또는 Kafka로 교체 시 이 모듈의 인터페이스 유지
- backpressure / queue size 제한, disconnect GC 추가 예정
"""
from __future__ import annotations

import asyncio
import time
from typing import Dict, Set, Any

class RealtimeHub:
    def __init__(self) -> None:
        # user_id -> set(WebSocket-like) ; WebSocket은 .send_text(str) 지원 필요
        self._user_channels: Dict[int, Set[Any]] = {}
        # monitor(관리) 채널(전체 세션 관찰)
        self._monitor: Set[Any] = set()
        self._lock = asyncio.Lock()
        # 최근 이벤트 메모리 (간단 sliding window)
        self._recent_events: list[dict[str, Any]] = []
        self._max_recent = 200

    async def register_user(self, user_id: int, ws: Any) -> None:
        async with self._lock:
            self._user_channels.setdefault(user_id, set()).add(ws)

    async def unregister_user(self, user_id: int, ws: Any) -> None:
        async with self._lock:
            bucket = self._user_channels.get(user_id)
            if bucket and ws in bucket:
                bucket.remove(ws)
                if not bucket:
                    self._user_channels.pop(user_id, None)

    async def register_monitor(self, ws: Any) -> None:
        async with self._lock:
            self._monitor.add(ws)

    async def unregister_monitor(self, ws: Any) -> None:
        async with self._lock:
            self._monitor.discard(ws)

    def _remember(self, event: dict[str, Any]) -> None:
        event.setdefault("ts", time.time())
        self._recent_events.append(event)
        if len(self._recent_events) > self._max_recent:
            # 앞부분 트림
            self._recent_events = self._recent_events[-self._max_recent :]

    async def broadcast(self, event: dict[str, Any]) -> None:
        """모니터 + 사용자 타겟 브로드캐스트.
        event 예시: {"type":"game_event","user_id":123,"game_type":"slot", ...}
        """
        self._remember(event)
        text = None
        try:
            import json
            text = json.dumps(event, default=str)
        except Exception:
            return
        targets: Set[Any] = set()
        async with self._lock:
            uid = event.get("user_id")
            if uid in self._user_channels:
                targets |= self._user_channels[uid]
            targets |= self._monitor
        coros = []
        for ws in list(targets):
            try:
                coros.append(ws.send_text(text))
            except Exception:
                # 개별 오류 무시
                pass
        if coros:
            await asyncio.gather(*coros, return_exceptions=True)

    async def snapshot_for_monitor(self) -> dict[str, Any]:
        async with self._lock:
            return {
                "type": "monitor_snapshot",
                "active_users": len(self._user_channels),
                "connections": sum(len(v) for v in self._user_channels.values()),
                "recent_events": self._recent_events[-20:],
            }

# 전역 싱글톤 (애플리케이션 기동 시 main에서 import)
hub = RealtimeHub()

async def broadcast_game_session_event(event: dict[str, Any]) -> None:
    # 기존 games.py에서 lazy import로 호출
    await hub.broadcast({"type": "game_session", **event})
