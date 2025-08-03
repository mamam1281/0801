from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends


from ..websockets import manager
from ..database import get_db
# from .auth import get_current_user_from_token # A dependency to get user from token

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
            # We can receive messages from the client if needed
            data = await websocket.receive_text()
            # For now, we just keep the connection open
    except WebSocketDisconnect:
        manager.disconnect(user_id)
