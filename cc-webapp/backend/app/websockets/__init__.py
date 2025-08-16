"""Deprecated shim: prefer app.realtime.hub

기존 `manager` 명칭을 사용하던 코드가 있을 수 있어 hub alias 제공
"""
from ..realtime import hub as manager  # type: ignore  # noqa: F401
from .chat import WebSocketManager  # noqa: F401
