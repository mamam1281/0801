from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi import status

class AppError(Exception):
    code = "app_error"
    http_status = status.HTTP_400_BAD_REQUEST
    def __init__(self, message: str = "Application error", *, code: str | None = None, status_code: int | None = None):
        super().__init__(message)
        if code:
            self.code = code
        if status_code:
            self.http_status = status_code
        self.message = message

class AuthError(AppError):
    code = "auth_error"
    http_status = status.HTTP_401_UNAUTHORIZED

class PermissionDenied(AppError):
    code = "permission_denied"
    http_status = status.HTTP_403_FORBIDDEN

def format_error(code: str, message: str, request: Request, status_code: int):
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
            },
            "path": request.url.path,
        },
    )

def add_exception_handlers(app):
    @app.exception_handler(AppError)
    async def on_app_error(request: Request, exc: AppError):
        return format_error(exc.code, exc.message, request, exc.http_status)

    @app.exception_handler(Exception)
    async def on_unexpected_error(request: Request, exc: Exception):
        # Hide internals, return 500 JSON with minimal details
        return format_error("internal_error", "Unexpected server error", request, status.HTTP_500_INTERNAL_SERVER_ERROR)
