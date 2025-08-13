from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from datetime import datetime, timezone
from typing import Optional

from ..websockets import manager
from ..database import get_db
from ..services.notification_service import NotificationService
from ..services.user_service import UserService

router = APIRouter(
    prefix="/ws",
    tags=["websockets"],
)

@router.websocket("/notifications/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    # In a real app, you would get the user_id from the token, not the path.
    # token = websocket.query_params.get("token")
    # user = await get_current_user_from_token(token, db)
    # user_id = user.id

    await manager.connect(websocket, user_id)
    try:
        while True:
            # Optional keepalive / client messages; echo pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)


@router.post("/notify/{user_id}", tags=["websockets"])
async def push_notification(
    user_id: int,
    message: str,
):
    # push a simple notification payload; useful for smoke tests
    payload = {
        "type": "NOTIFICATION",
        "payload": {
            "message": message,
            "ts": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        },
    }
    await manager.send_personal_message(payload, user_id)
    return {"ok": True}


# Optional: SSE endpoint for environments where WS is restricted
from fastapi import Request
from fastapi.responses import StreamingResponse
import asyncio

@router.get("/sse/notifications")
async def sse_notifications(request: Request, user_id: int):
    """Simple SSE stream; filters messages by user_id in payload when present."""

    async def event_generator():
        # naive demo: poll manager offline buffer and send keepalive
        keepalive = 0
        while True:
            if await request.is_disconnected():
                break
            # send keepalive every ~15 seconds
            if keepalive % 15 == 0:
                yield f"data: {{\"type\":\"keepalive\",\"ts\":\"{datetime.now(timezone.utc).isoformat()}\"}}\n\n"
            await asyncio.sleep(1)
            keepalive += 1

    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    }
    return StreamingResponse(event_generator(), media_type="text/event-stream", headers=headers)
