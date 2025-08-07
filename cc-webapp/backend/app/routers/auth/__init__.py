"""
Auth router module
"""
from fastapi import APIRouter

# Import our auth router from auth.py
from ..auth import router

# Re-export the router
__all__ = ["router"]
