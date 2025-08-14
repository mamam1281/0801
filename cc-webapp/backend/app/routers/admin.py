"""Simple Admin API Router - Provides administrative functions for admin users"""

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from ..database import get_db
from ..dependencies import get_current_user
from ..services.admin_service import AdminService
from ..services.limited_package_service import LimitedPackageService
from datetime import datetime
from sqlalchemy.orm import Session
from app import models
from ..services.catalog_service import CatalogService, Product

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


# ====== Admin Users (목록, 상세, 등급/상태 변경, 삭제, 로그) ======

class UserListParams(BaseModel):
    skip: int = Field(0, ge=0)
    limit: int = Field(20, ge=1, le=200)
    search: Optional[str] = None

class UserSummary(BaseModel):
    id: int
    site_id: str
    nickname: str
    phone_number: Optional[str] = None
    is_active: bool
    is_admin: bool
    user_rank: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserDetail(UserSummary):
    cyber_token_balance: int
    last_login: Optional[datetime] = None

class UpdateUserRankRequest(BaseModel):
    user_rank: str = Field(..., description="STANDARD|VIP 등")

class UpdateUserStatusRequest(BaseModel):
    is_active: bool

class AdminLogResponse(BaseModel):
    id: int
    user_id: int
    action_type: str
    created_at: datetime
    details: Optional[str] = None


# Dependency injection (placed early so it's available for endpoints below)
def get_admin_service(db = Depends(get_db)) -> AdminService:
    """Admin service dependency"""
    return AdminService(db)

async def require_admin_access(current_user = Depends(get_current_user)):
    """Require admin access"""
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


@router.get("/users", response_model=List[UserSummary])
async def admin_list_users(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    admin_user = Depends(require_admin_access),
    db: Session = Depends(get_db),
    admin_service: AdminService = Depends(get_admin_service),
):
    users = admin_service.list_users(skip, limit, search)
    return [UserSummary.model_validate(u) for u in users]


@router.get("/users/{user_id}", response_model=UserDetail)
async def admin_user_detail(
    user_id: int,
    admin_user = Depends(require_admin_access),
    db: Session = Depends(get_db),
    admin_service: AdminService = Depends(get_admin_service),
):
    u = admin_service.get_user_details(user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return UserDetail.model_validate(u)


@router.put("/users/{user_id}/rank")
async def admin_update_rank(
    user_id: int,
    body: UpdateUserRankRequest,
    admin_user = Depends(require_admin_access),
    db: Session = Depends(get_db),
):
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u.user_rank = body.user_rank
    db.add(u)
    db.commit()
    return {"success": True, "user_id": user_id, "user_rank": u.user_rank}


@router.put("/users/{user_id}/status")
async def admin_update_status(
    user_id: int,
    body: UpdateUserStatusRequest,
    admin_user = Depends(require_admin_access),
    db: Session = Depends(get_db),
):
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u.is_active = body.is_active
    db.add(u)
    db.commit()
    return {"success": True, "user_id": user_id, "is_active": u.is_active}


@router.delete("/users/{user_id}")
async def admin_delete_user(
    user_id: int,
    admin_user = Depends(require_admin_access),
    db: Session = Depends(get_db),
):
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(u)
    db.commit()
    return {"success": True}


@router.get("/users/{user_id}/logs", response_model=List[AdminLogResponse])
async def admin_user_logs(
    user_id: int,
    limit: int = 50,
    admin_user = Depends(require_admin_access),
    db: Session = Depends(get_db),
    admin_service: AdminService = Depends(get_admin_service),
):
    logs = admin_service.get_user_activities(user_id, limit)
    # Map to response (rename fields)
    resp: List[AdminLogResponse] = []
    for a in logs:
        resp.append(AdminLogResponse(
            id=getattr(a, 'id', 0),
            user_id=getattr(a, 'user_id', user_id),
            action_type=getattr(a, 'activity_type', getattr(a, 'action_type', 'ACTION')),
            created_at=getattr(a, 'created_at', getattr(a, 'timestamp', datetime.utcnow())),
            details=getattr(a, 'activity_data', getattr(a, 'action_data', None)),
        ))
    return resp

# ====== Shop/Item Admin (Catalog CRUD) ======
class AdminCatalogItemIn(BaseModel):
    id: int = Field(..., description="Product ID")
    sku: str
    name: str
    price_cents: int = Field(..., ge=0)
    gems: int = Field(..., ge=0)
    discount_percent: int = Field(0, ge=0, le=100)
    discount_ends_at: Optional[datetime] = None
    min_rank: Optional[str] = None

class AdminCatalogItemOut(BaseModel):
    id: int
    sku: str
    name: str
    price_cents: int
    gems: int
    discount_percent: int = 0
    discount_ends_at: Optional[datetime] = None
    min_rank: Optional[str] = None

@router.get("/shop/items", response_model=list[AdminCatalogItemOut])
async def admin_list_items(admin_user = Depends(require_admin_access)):
    items = []
    for p in CatalogService.list_products():
        items.append(AdminCatalogItemOut(
            id=p.id,
            sku=p.sku,
            name=p.name,
            price_cents=p.price_cents,
            gems=p.gems,
            discount_percent=p.discount_percent or 0,
            discount_ends_at=p.discount_ends_at,
            min_rank=p.min_rank,
        ))
    return items

@router.post("/shop/items", response_model=AdminCatalogItemOut)
async def admin_create_item(body: AdminCatalogItemIn, admin_user = Depends(require_admin_access)):
    if CatalogService.get_product(body.id):
        raise HTTPException(status_code=400, detail="Product id already exists")
    prod = Product(
        id=body.id,
        sku=body.sku,
        name=body.name,
        price_cents=body.price_cents,
        gems=body.gems,
        discount_percent=body.discount_percent or 0,
        discount_ends_at=body.discount_ends_at,
        min_rank=body.min_rank,
    )
    CatalogService._catalog[body.id] = prod  # noqa: SLF001
    return AdminCatalogItemOut(**prod.__dict__)

@router.put("/shop/items/{item_id}", response_model=AdminCatalogItemOut)
async def admin_update_item(item_id: int, body: AdminCatalogItemIn, admin_user = Depends(require_admin_access)):
    if item_id != body.id:
        raise HTTPException(status_code=400, detail="Path id and body id must match")
    prod = CatalogService.get_product(item_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    new_prod = Product(
        id=body.id,
        sku=body.sku,
        name=body.name,
        price_cents=body.price_cents,
        gems=body.gems,
        discount_percent=body.discount_percent or 0,
        discount_ends_at=body.discount_ends_at,
        min_rank=body.min_rank,
    )
    CatalogService._catalog[item_id] = new_prod  # noqa: SLF001
    return AdminCatalogItemOut(**new_prod.__dict__)

@router.delete("/shop/items/{item_id}")
async def admin_delete_item(item_id: int, admin_user = Depends(require_admin_access)):
    if not CatalogService.get_product(item_id):
        raise HTTPException(status_code=404, detail="Product not found")
    del CatalogService._catalog[item_id]  # noqa: SLF001
    return {"success": True}

class AdminDiscountPatch(BaseModel):
    discount_percent: int = Field(..., ge=0, le=100)
    discount_ends_at: Optional[datetime] = None

@router.patch("/shop/items/{item_id}/discount", response_model=AdminCatalogItemOut)
async def admin_set_discount(item_id: int, body: AdminDiscountPatch, admin_user = Depends(require_admin_access)):
    prod = CatalogService.get_product(item_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    updated = Product(
        id=prod.id,
        sku=prod.sku,
        name=prod.name,
        price_cents=prod.price_cents,
        gems=prod.gems,
        discount_percent=body.discount_percent,
        discount_ends_at=body.discount_ends_at,
        min_rank=prod.min_rank,
    )
    CatalogService._catalog[item_id] = updated  # noqa: SLF001
    return AdminCatalogItemOut(**updated.__dict__)

class AdminRankPatch(BaseModel):
    min_rank: Optional[str] = None

@router.patch("/shop/items/{item_id}/rank", response_model=AdminCatalogItemOut)
async def admin_set_rank(item_id: int, body: AdminRankPatch, admin_user = Depends(require_admin_access)):
    prod = CatalogService.get_product(item_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    updated = Product(
        id=prod.id,
        sku=prod.sku,
        name=prod.name,
        price_cents=prod.price_cents,
        gems=prod.gems,
        discount_percent=prod.discount_percent or 0,
        discount_ends_at=prod.discount_ends_at,
        min_rank=body.min_rank,
    )
    CatalogService._catalog[item_id] = updated  # noqa: SLF001
    return AdminCatalogItemOut(**updated.__dict__)

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


# ====== Gacha 확률 테이블/보상 풀 관리 (런타임 갱신) ======
class GachaConfigUpdate(BaseModel):
    rarity_table: Optional[List[List[float | str]]] = None  # [["Legendary", 0.002], ...]
    reward_pool: Optional[dict[str, int]] = None

@router.post("/gacha/config")
async def admin_update_gacha_config(
    body: GachaConfigUpdate,
    admin_user = Depends(require_admin_access),
    db: Session = Depends(get_db),
):
    # Access GameService via a short import to update class-level config
    from ..services.gacha_service import GachaService
    rarity_table = None
    if body.rarity_table:
        try:
            rarity_table = [(str(name), float(prob)) for name, prob in body.rarity_table]  # type: ignore
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid rarity_table format")
    reward_pool = None
    if body.reward_pool:
        reward_pool = {str(k): int(v) for k, v in body.reward_pool.items()}
    # Apply to a temporary instance then to class defaults for new instances
    svc = GachaService(db=db)
    svc.update_config(rarity_table=rarity_table, reward_pool=reward_pool)
    # Optional: update class default for ephemeral instances
    if rarity_table:
        GachaService.DEFAULT_RARITY_TABLE = rarity_table  # type: ignore
    return {"success": True, "config": svc.get_config()}


# ====== 알림/캠페인 관리 ======
class CampaignCreateRequest(BaseModel):
    title: str
    message: str
    targeting_type: str = Field("all", pattern="^(all|segment|user_ids)$")
    target_segment: Optional[str] = None
    user_ids: Optional[List[int]] = None
    scheduled_at: Optional[datetime] = None


@router.post("/campaigns")
async def create_campaign(
    body: CampaignCreateRequest,
    admin_user = Depends(require_admin_access),
    db: Session = Depends(get_db),
):
    camp = models.NotificationCampaign(
        title=body.title,
        message=body.message,
        targeting_type=body.targeting_type,
        target_segment=body.target_segment,
        user_ids=",".join(str(i) for i in (body.user_ids or [])) or None,
        scheduled_at=body.scheduled_at,
        status="scheduled",
    )
    db.add(camp)
    db.commit()
    db.refresh(camp)
    return {"success": True, "id": camp.id}


@router.post("/campaigns/{campaign_id}/cancel")
async def cancel_campaign(
    campaign_id: int,
    admin_user = Depends(require_admin_access),
    db: Session = Depends(get_db),
):
    camp = db.query(models.NotificationCampaign).filter(models.NotificationCampaign.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if camp.status != "scheduled":
        raise HTTPException(status_code=400, detail="Only scheduled campaigns can be cancelled")
    camp.status = "cancelled"
    db.add(camp)
    db.commit()
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
