"""Simple Admin API Router - Provides administrative functions for admin users"""

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ..database import get_db
from ..dependencies import get_current_user
from ..services.admin_service import AdminService
from ..services.limited_package_service import LimitedPackageService
from datetime import datetime

router = APIRouter(prefix="/api/admin", tags=["Admin"])

class AdminStatsResponse(BaseModel):
    """Admin statistics response"""
    total_users: int
    active_users: int
    total_games_played: int
    total_tokens_in_circulation: int

class UserBanRequest(BaseModel):
    """User ban request"""
    user_id: int
    reason: str
    duration_hours: Optional[int] = None

class LimitedToggleRequest(BaseModel):
    code: str
    active: bool

class LimitedPeriodRequest(BaseModel):
    code: str
    start_at: datetime
    end_at: datetime

class LimitedStockRequest(BaseModel):
    code: str
    initial_stock: Optional[int] = None

class LimitedPerUserLimitRequest(BaseModel):
    code: str
    per_user_limit: int

class LimitedPromoRequest(BaseModel):
    code: str
    promo_code: str
    cents_off: int

# Dependency injection
def get_admin_service(db = Depends(get_db)) -> AdminService:
    """Admin service dependency"""
    return AdminService(db)

async def require_admin_access(current_user = Depends(get_current_user)):
    """Require admin access"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

# API endpoints
@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    admin_user = Depends(require_admin_access),
    db = Depends(get_db),
    admin_service: AdminService = Depends(get_admin_service)
):
    """Get admin statistics"""
    try:
        stats = admin_service.get_system_stats()
        
        return AdminStatsResponse(
            total_users=getattr(stats, 'total_users', 0),
            active_users=getattr(stats, 'active_users', 0),
            total_games_played=getattr(stats, 'total_games_played', 0),
            total_tokens_in_circulation=getattr(stats, 'total_tokens_in_circulation', 0)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get admin stats: {str(e)}"
        )

@router.post("/users/{user_id}/ban")
async def ban_user(
    user_id: int,
    ban_data: UserBanRequest,
    admin_user = Depends(require_admin_access),
    db = Depends(get_db),
    admin_service: AdminService = Depends(get_admin_service)
):
    """Ban a user"""
    try:
        result = admin_service.ban_user(user_id, ban_data.reason, ban_data.duration_hours)
        
        return {
            "success": True,
            "message": f"User {user_id} has been banned",
            "banned_until": getattr(result, 'banned_until', None),
            "reason": ban_data.reason
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to ban user: {str(e)}"
        )

@router.post("/users/{user_id}/unban")
async def unban_user(
    user_id: int,
    admin_user = Depends(require_admin_access),
    db = Depends(get_db),
    admin_service: AdminService = Depends(get_admin_service)
):
    """Unban a user"""
    try:
        admin_service.unban_user(user_id)
        
        return {
            "success": True,
            "message": f"User {user_id} has been unbanned"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unban user: {str(e)}"
        )

@router.post("/users/{user_id}/tokens/add")
async def add_user_tokens(
    user_id: int,
    amount: int,
    admin_user = Depends(require_admin_access),
    db = Depends(get_db),
    admin_service: AdminService = Depends(get_admin_service)
):
    """Add tokens to a user account (admin only)"""
    try:
        if amount <= 0:
            raise ValueError("Amount must be positive")
            
        new_balance = admin_service.add_user_tokens(user_id, amount)
        
        return {
            "success": True,
            "message": f"Added {amount} tokens to user {user_id}",
            "new_balance": new_balance,
            "admin_id": admin_user.id
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add tokens: {str(e)}"
        )

# --- Limited Packages Admin (MVP in-memory) ---
@router.post("/limited/toggle")
async def admin_limited_toggle(req: LimitedToggleRequest, admin_user = Depends(require_admin_access)):
    if not LimitedPackageService.set_active(req.code, req.active):
        raise HTTPException(status_code=404, detail="Package not found")
    return {"success": True}

@router.post("/limited/period")
async def admin_limited_period(req: LimitedPeriodRequest, admin_user = Depends(require_admin_access)):
    ok = LimitedPackageService.set_period(req.code, req.start_at, req.end_at)
    if not ok:
        raise HTTPException(status_code=404, detail="Package not found")
    return {"success": True}

@router.post("/limited/stock")
async def admin_limited_stock(req: LimitedStockRequest, admin_user = Depends(require_admin_access)):
    ok = LimitedPackageService.set_initial_stock(req.code, req.initial_stock)
    if not ok:
        raise HTTPException(status_code=404, detail="Package not found")
    return {"success": True}

@router.post("/limited/per-user-limit")
async def admin_limited_per_user_limit(req: LimitedPerUserLimitRequest, admin_user = Depends(require_admin_access)):
    ok = LimitedPackageService.set_per_user_limit(req.code, req.per_user_limit)
    if not ok:
        raise HTTPException(status_code=404, detail="Package not found")
    return {"success": True}

@router.post("/limited/promo/set")
async def admin_limited_promo_set(req: LimitedPromoRequest, admin_user = Depends(require_admin_access)):
    LimitedPackageService.set_promo_discount(req.code, req.promo_code, req.cents_off)
    return {"success": True}

@router.post("/limited/promo/clear")
async def admin_limited_promo_clear(req: LimitedPromoRequest, admin_user = Depends(require_admin_access)):
    LimitedPackageService.clear_promo_discount(req.code, req.promo_code)
    return {"success": True}
