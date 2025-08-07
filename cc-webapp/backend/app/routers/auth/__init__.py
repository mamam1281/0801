"""
Auth router module
"""
from fastapi import APIRouter

# Import our improved auth endpoints
from ...auth.auth_endpoints import router

# Re-export the router
__all__ = ["router"]
