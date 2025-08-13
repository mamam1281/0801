from typing import Optional, Set, List, Dict, Any
import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel

from ..websockets import manager

# WebSocket router
router = APIRouter(prefix="/ws", tags=["websockets"])


@router.websocket("/notifications/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    """WebSocket notifications endpoint.

    Query params:
      - topics: comma-separated list of topics to subscribe to (optional)
    """
    # Parse topic subscriptions from querystring
    topics_param = websocket.query_params.get("topics")
    topics: Optional[Set[str]] = set(
        t.strip() for t in topics_param.split(",") if t.strip()
    ) if topics_param else None

    await manager.connect_ws(websocket, user_id, topics=topics)
    try:
        while True:
            # Basic keepalive handling: ignore any received pings
            _ = await websocket.receive_text()
            # Clients can optionally send commands like:
            # {"type":"subscribe","topics":["a","b"]}
            # We keep it simple here and just keep the connection alive.
            # Advanced control can be added later.
    except WebSocketDisconnect:
        await manager.disconnect_ws(user_id, websocket)


# SSE router
sse_router = APIRouter(prefix="/sse", tags=["sse"])


def _format_sse(event: Dict[str, Any]) -> str:
    """Format a single SSE event frame."""
    lines = []
    if event.get("id") is not None:
        lines.append(f"id: {event['id']}")
    if event.get("topic"):
        lines.append(f"event: {event['topic']}")
    lines.append("data: " + JSONResponse(content=event["data"]).body.decode("utf-8"))
    lines.append("")  # blank line terminator
    return "\n".join(lines) + "\n"


@sse_router.get("/notifications/{user_id}")
async def sse_notifications(request: Request, user_id: int, topics: Optional[str] = None):
    """SSE notifications stream for a user.

    Headers:
      - Last-Event-ID: resume from this id if provided
    Query:
      - topics: comma-separated topic filters (optional)
    """

    topic_set: Optional[Set[str]] = set(t.strip() for t in topics.split(",") if t.strip()) if topics else None
    last_event_id: Optional[int] = None
    try:
        lei = request.headers.get("Last-Event-ID")
        if lei is not None:
            last_event_id = int(lei)
    except Exception:
        last_event_id = None

    async def event_generator():
        # Register queue
        q = await manager.register_sse(user_id)

        # Send backfill if provided
        try:
            for ev in list(manager.get_backfill(user_id, last_event_id)):
                if topic_set and ev.get("topic") not in topic_set:
                    continue
                yield _format_sse(ev)
        except Exception:
            # Backfill best-effort
            pass

        try:
            while True:
                # Wait for next item with heartbeat timeout
                try:
                    priority, ev = await asyncio.wait_for(q.get(), timeout=15.0)
                    if topic_set and ev.get("topic") not in topic_set:
                        continue
                    # Drain a small batch to coalesce
                    batch: List[str] = [_format_sse(ev)]
                    for _ in range(49):  # up to 50 per flush
                        try:
                            priority2, ev2 = q.get_nowait()
                            if topic_set and ev2.get("topic") not in topic_set:
                                continue
                            batch.append(_format_sse(ev2))
                        except Exception:
                            break
                    yield "".join(batch)
                except asyncio.TimeoutError:
                    # Heartbeat comment to keep connection alive
                    yield ": ping\n\n"
                # Client disconnect check
                if await request.is_disconnected():
                    break
        finally:
            await manager.unregister_sse(user_id, q)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# Simple dev-only API to enqueue a message for testing
api_router = APIRouter(prefix="/api/notifications", tags=["Real-time Notifications"])


class SendNotificationRequest(BaseModel):
    message: Any
    topic: Optional[str] = None
    priority: int = 0


@api_router.post("/{user_id}/send")
async def send_notification(user_id: int, body: SendNotificationRequest):
    await manager.enqueue(user_id, message=body.message, priority=body.priority, topic=body.topic)
    return {"ok": True}
