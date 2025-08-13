"""Simple Admin API Router - Provides administrative functions for admin users"""

import logging
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ..database import get_db
from ..dependencies import get_current_user
from ..services.admin_service import AdminService
from ..services.shop_service import ShopService
from .. import models

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

# Dependency injection
def get_admin_service(db = Depends(get_db)) -> AdminService:
    """Admin service dependency"""
    return AdminService(db)

def get_shop_service(db = Depends(get_db)) -> ShopService:
    return ShopService(db)

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


# ----- Shop transactions (admin) -----
class AdminTransactionSearchResponse(BaseModel):
    user_id: int
    product_id: str
    kind: str
    quantity: int
    unit_price: int
    amount: int
    status: str
    payment_method: Optional[str] = None
    receipt_code: Optional[str] = None
    failure_reason: Optional[str] = None
    created_at: Optional[str] = None


@router.get("/transactions", response_model=List[AdminTransactionSearchResponse])
async def admin_search_transactions(
    user_id: Optional[int] = None,
    product_id: Optional[str] = None,
    status: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
    receipt_code: Optional[str] = None,
    limit: int = 50,
    admin_user = Depends(require_admin_access),
    shop_service: ShopService = Depends(get_shop_service),
):
    start_dt = datetime.fromisoformat(start) if start else None
    end_dt = datetime.fromisoformat(end) if end else None
    rows = shop_service.admin_search_transactions(
        user_id=user_id,
        product_id=product_id,
        status=status,
        start=start_dt,
        end=end_dt,
        receipt_code=receipt_code,
        limit=limit,
    )
    return rows


class AdminRefundRequest(BaseModel):
    reason: Optional[str] = None


@router.post("/transactions/{receipt_code}/refund")
async def admin_refund_transaction(
    receipt_code: str,
    req: AdminRefundRequest,
    admin_user = Depends(require_admin_access),
    shop_service: ShopService = Depends(get_shop_service),
):
    result = shop_service.refund_transaction(receipt_code=receipt_code, reason=req.reason)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message"))
    return {"success": True, "message": result.get("message")}


class ForceSettleRequest(BaseModel):
    outcome: Optional[str] = 'success'  # 'success' or 'failed'


@router.post("/transactions/{receipt_code}/force-settle")
async def admin_force_settle(
    receipt_code: str,
    req: ForceSettleRequest,
    admin_user = Depends(require_admin_access),
    shop_service: ShopService = Depends(get_shop_service),
):
    outcome = 'success' if req.outcome not in ('success', 'failed') else req.outcome
    res = shop_service.admin_force_settle(receipt_code=receipt_code, outcome=outcome)  # type: ignore[arg-type]
    if not res.get('success'):
        raise HTTPException(status_code=400, detail=res.get('message'))
    return res


# ----- Limited Packages (admin) -----
class LimitedUpsertRequest(BaseModel):
    package_id: str
    name: str
    description: str | None = None
    price: int
    starts_at: str | None = None
    ends_at: str | None = None
    stock_total: int | None = None
    stock_remaining: int | None = None
    per_user_limit: int | None = None
    emergency_disabled: bool | None = None
    contents: dict | None = None
    is_active: bool | None = None


@router.post("/limited-packages/upsert")
async def admin_limited_upsert(
    req: LimitedUpsertRequest,
    admin_user = Depends(require_admin_access),
    db = Depends(get_db),
):
    # Minimal upsert without separate repository
    from ..models.shop_models import ShopLimitedPackage
    starts_at = datetime.fromisoformat(req.starts_at) if req.starts_at else None
    ends_at = datetime.fromisoformat(req.ends_at) if req.ends_at else None
    row = db.query(ShopLimitedPackage).filter(ShopLimitedPackage.package_id == req.package_id).first()
    if not row:
        row = ShopLimitedPackage(
            package_id=req.package_id,
            name=req.name,
            description=req.description,
            price=req.price,
            starts_at=starts_at,
            ends_at=ends_at,
            stock_total=req.stock_total,
            stock_remaining=req.stock_remaining if req.stock_remaining is not None else req.stock_total,
            per_user_limit=req.per_user_limit,
            emergency_disabled=bool(req.emergency_disabled) if req.emergency_disabled is not None else False,
            contents=req.contents,
            is_active=True if req.is_active is None else bool(req.is_active),
        )
        db.add(row)
    else:
        row.name = req.name
        row.description = req.description
        row.price = req.price
        row.starts_at = starts_at
        row.ends_at = ends_at
        row.stock_total = req.stock_total
        if req.stock_remaining is not None:
            row.stock_remaining = req.stock_remaining
        row.per_user_limit = req.per_user_limit
        if req.emergency_disabled is not None:
            row.emergency_disabled = bool(req.emergency_disabled)
        row.contents = req.contents
        if req.is_active is not None:
            row.is_active = bool(req.is_active)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to upsert limited package")
    return {"success": True, "message": "Upserted"}


@router.post("/limited-packages/{package_id}/disable")
async def admin_limited_disable(
    package_id: str,
    admin_user = Depends(require_admin_access),
    db = Depends(get_db),
):
    from ..models.shop_models import ShopLimitedPackage
    row = db.query(ShopLimitedPackage).filter(ShopLimitedPackage.package_id == package_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Package not found")
    row.emergency_disabled = True
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to disable package")
    return {"success": True, "message": "Disabled"}
