from fastapi import FastAPI

from .auth_endpoints import router as auth_router

def configure_auth_routes(app: FastAPI):
    """
    Configure all authentication-related routes
    
    Args:
        app: FastAPI application instance
    """
    # Include the auth router with enhanced JWT token handling
    app.include_router(auth_router)
