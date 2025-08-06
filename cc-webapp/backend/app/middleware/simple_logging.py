"""간단한 API 로깅 미들웨어"""
import logging
import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("api")

class SimpleLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # API 시도 로그
        logger.info(f"🚀 API 시도: {request.method} {request.url.path}")
        
        try:
            response = await call_next(request)
            
            # 처리 시간 계산
            process_time = time.time() - start_time
            
            # 성공 로그
            if response.status_code < 400:
                logger.info(f"✅ API 성공: {request.method} {request.url.path} - {response.status_code} ({process_time:.2f}s)")
            else:
                logger.warning(f"⚠️ API 실패: {request.method} {request.url.path} - {response.status_code} ({process_time:.2f}s)")
            
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(f"❌ API 에러: {request.method} {request.url.path} - {str(e)} ({process_time:.2f}s)")
            raise
