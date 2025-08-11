import logging
import os
import sys
from typing import Dict, Any
import time
from datetime import datetime

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

def setup_logging(level: str = "INFO"):
    logging.basicConfig(
        level=getattr(logging, level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[logging.StreamHandler(sys.stdout)]
    )

class LoggingContextMiddleware:
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        await self.app(scope, receive, send)
