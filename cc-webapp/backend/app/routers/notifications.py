from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Request, HTTPException
from datetime import datetime, timezone
from typing import Optional, List
import asyncio

from ..realtime import manager
from ..database import get_db
from sqlalchemy.orm import Session

# Service implemented below in this file (minimal CRUD + enqueue)
from ..models import Notification
from pydantic import BaseModel
from fastapi.responses import StreamingResponse


# ---------------------
# Routers
# ---------------------
sse_router = APIRouter(prefix="/sse", tags=["Real-time Notifications"])
ws_router = APIRouter(prefix="/ws", tags=["Real-time Notifications"])
api_router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


# ---------------------
# WebSocket
# ---------------------
@ws_router.websocket("/notifications/{user_id}")
async def websocket_notifications(websocket: WebSocket, user_id: int):
    await manager.connect_ws(websocket, user_id)
    try:
        while True:
            msg = await websocket.receive_text()
            if msg == "ping":
                await websocket.send_text("pong")
            # optional: allow client to set topics
            elif msg.startswith("topics:"):
                parts = msg.split(":", 1)[1].strip()
                topics = set([p.strip() for p in parts.split(",") if p.strip()])
                await manager.update_ws_topics(user_id, websocket, topics)
            await manager.touch_ws(user_id, websocket)
    except WebSocketDisconnect:
        await manager.disconnect_ws(user_id, websocket)


# ---------------------
# SSE
# ---------------------
@sse_router.get("/notifications")
async def sse_notifications(request: Request, user_id: int, lastEventId: Optional[int] = None):
    q = await manager.register_sse(user_id)

    async def stream():
        # backfill first
        for item in manager.get_backfill(user_id, lastEventId):
            yield f"id: {item['id']}\n"
            yield f"event: {item['topic']}\n"
            yield f"data: {item['data']}\n\n"
        try:
            while True:
                if await request.is_disconnected():
                    break
                priority, payload = await q.get()
                yield f"id: {payload['id']}\n"
                yield f"event: {payload['topic']}\n"
                yield f"data: {payload['data']}\n\n"
        finally:
            await manager.unregister_sse(user_id, q)

    headers = {"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"}
    return StreamingResponse(stream(), media_type="text/event-stream", headers=headers)


# ---------------------
# REST API
# ---------------------
class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str
    notification_type: str = "info"
    topic: Optional[str] = "notif"


@api_router.post("/push")
async def api_push_notification(body: NotificationCreate, db: Session = Depends(get_db)):
    n = Notification(
        user_id=body.user_id,
        title=body.title,
        message=body.message,
        notification_type=body.notification_type,
        is_sent=True,
    )
    db.add(n)
    db.commit()
    # enqueue for real-time delivery
    await manager.enqueue(body.user_id, {
        "type": body.notification_type,
        "title": body.title,
        "message": body.message,
        "ts": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }, priority=1, topic=body.topic or "notif")
    return {"ok": True, "id": n.id}


@api_router.get("/list", response_model=List[dict])
def api_list_notifications(user_id: int, db: Session = Depends(get_db)):
    rows = db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).limit(100).all()
    return [
        {
            "id": r.id,
            "title": r.title,
            "message": r.message,
            "type": r.notification_type,
            "is_read": r.is_read,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


@api_router.post("/read/{notif_id}")
def api_mark_read(notif_id: int, db: Session = Depends(get_db)):
    row = db.query(Notification).filter(Notification.id == notif_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Notification not found")
    row.is_read = True
    row.read_at = datetime.now(timezone.utc)
    db.add(row)
    db.commit()
    return {"ok": True}

