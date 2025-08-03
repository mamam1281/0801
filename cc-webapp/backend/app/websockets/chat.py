"""WebSocket connection and message management."""

import logging
from typing import List

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WebSocketManager:
    """
    Manages WebSocket connections and message broadcasting.
    
    Handles multiple WebSocket connections, allowing connection,
    disconnection, and message broadcasting.
    """

    def __init__(self):
        """Initialize an empty list of active WebSocket connections."""
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """
        Add a new WebSocket connection to active connections.

        Args:
            websocket (WebSocket): WebSocket connection to add
        """
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        """
        Remove a WebSocket connection from active connections.

        Args:
            websocket (WebSocket): WebSocket connection to remove
        """
        try:
            self.active_connections.remove(websocket)
        except ValueError:
            logger.warning("Attempted to remove non-existent WebSocket connection")

    async def broadcast(self, message: str):
        """
        Send a message to all active WebSocket connections.

        Args:
            message (str): Message to broadcast
        """
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as exc:
                logger.error(f"Error broadcasting message: {exc}")
                self.disconnect(connection)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        """
        Send a message to a specific WebSocket connection.

        Args:
            message (str): Message to send
            websocket (WebSocket): Target WebSocket connection
        """
        try:
            await websocket.send_text(message)
        except Exception as exc:
            logger.error(f"Error sending personal message: {exc}")
            self.disconnect(websocket)
