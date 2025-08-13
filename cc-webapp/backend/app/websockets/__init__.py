# Deprecated shim: prefer app.realtime.manager
# Keeping imports for backward compatibility in modules that still import app.websockets
from ..realtime import manager  # noqa: F401
from .chat import WebSocketManager  # noqa: F401
