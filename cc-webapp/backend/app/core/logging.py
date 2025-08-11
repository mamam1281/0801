import logging
import json
import sys
import time
from datetime import datetime
from typing import Dict, Any

def get_logger(name: str):
    return logging.getLogger(name)

def log_error(exc: Exception, context: Dict[str, Any] = None):
    logger = get_logger("error")
    logger.error(f"Error: {str(exc)}", extra=context or {})

def log_service_call(service_name: str, operation: str, duration: float = None, status: str = "success", extra: Dict[str, Any] = None):
    """서비스 호출 로깅 함수"""
    logger = get_logger("service_calls")
    log_data = {
        "service": service_name,
        "operation": operation,
        "status": status,
        "timestamp": datetime.utcnow().isoformat(),
        **(extra or {})
    }
    
    if duration is not None:
        log_data["duration_ms"] = round(duration * 1000, 2)
    
    logger.info(f"Service call: {service_name}.{operation} - {status}", extra=log_data)

class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "ts": datetime.utcnow().isoformat() + "Z",
            "logger": record.name,
            "level": record.levelname,
            "msg": record.getMessage(),
        }
        for key in ("request_id", "path", "method", "status_code", "duration_ms", "user_id"):
            if hasattr(record, key):
                payload[key] = getattr(record, key)
        return json.dumps(payload, ensure_ascii=False)

def setup_logging(level: str = "INFO"):
    root = logging.getLogger()
    root.setLevel(getattr(logging, level.upper(), logging.INFO))
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    root.handlers = [handler]

class LoggingContextMiddleware:
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        await self.app(scope, receive, send)
