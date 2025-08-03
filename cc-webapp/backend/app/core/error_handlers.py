import logging
from typing import Dict, Any
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.status import HTTP_500_INTERNAL_SERVER_ERROR, HTTP_422_UNPROCESSABLE_ENTITY

logger = logging.getLogger(__name__)

def log_error(exc: Exception, context: Dict[str, Any] = None):
    logger.error(f'Error: {str(exc)}', extra=context or {})

def get_logger(name: str):
    return logging.getLogger(name)

class CasinoClubException(Exception):
    def __init__(self, message: str, error_code: str = 'GENERAL_ERROR', status_code: int = 500):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        super().__init__(self.message)

class UserServiceException(CasinoClubException):
    def __init__(self, message: str, error_code: str = 'USER_ERROR'):
        super().__init__(message, error_code, 400)

class InviteCodeException(CasinoClubException):
    def __init__(self, message: str, error_code: str = 'INVITE_CODE_ERROR'):
        super().__init__(message, error_code, 400)

class AuthenticationException(CasinoClubException):
    def __init__(self, message: str = 'Authentication failed', error_code: str = 'AUTH_ERROR'):
        super().__init__(message, error_code, 401)

class AuthorizationException(CasinoClubException):
    def __init__(self, message: str = 'Authorization failed', error_code: str = 'AUTHORIZATION_ERROR'):
        super().__init__(message, error_code, 403)

class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            return JSONResponse(
                status_code=HTTP_500_INTERNAL_SERVER_ERROR,
                content={'detail': 'Internal server error', 'error_code': 'INTERNAL_ERROR'}
            )

def add_exception_handlers(app):
    pass

error_handling_middleware = ErrorHandlingMiddleware
