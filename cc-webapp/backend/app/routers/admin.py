"""Simple Admin API Router - Provides administrative functions for admin users"""

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from fastapi.responses import StreamingResponse
import csv
import io

from ..database import get_db
from ..dependencies import get_current_user
from ..core.config import settings
from ..services.admin_service import AdminService
from ..services.limited_package_service import LimitedPackageService
from datetime import datetime
from sqlalchemy.orm import Session
from app import models
from ..models.auth_models import RefreshToken, UserSession
from ..services.catalog_service import CatalogService, Product
from ..database import get_db
from ..services.email_service import EmailService
from ..services import email_templates

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


class AdminUserUpdateRequest(BaseModel):
    """Generic admin user update request.

    Allows toggling is_admin, is_active and updating user_rank in one call.
    """
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None
    user_rank: Optional[str] = None


class ElevateRequest(BaseModel):
    site_id: str


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


# ====== Admin Email Trigger (샘플) ======
class AdminEmailTriggerRequest(BaseModel):
    """관리자 전용 템플릿 이메일 발송 트리거

    - 대상 단일 계정: user_id 또는 site_id 지정
    - 대상 세그먼트: segment 지정 (UserSegment.rfm_group 라벨)
    - template: email_templates.py에 정의된 키 (welcome|reward|event 등)
    - context: 템플릿 렌더링에 사용될 추가 값 (부족하면 서버에서 기본값 보충)
    """
    template: str
    user_id: Optional[int] = None
    site_id: Optional[str] = None
    segment: Optional[str] = None
    context: Optional[dict] = None


@router.post("/email/trigger")
async def admin_email_trigger(
    body: AdminEmailTriggerRequest,
    admin_user = Depends(require_admin_access),
    db: Session = Depends(get_db),
):
    # Validate template early
    if body.template not in email_templates.TEMPLATES:
        raise HTTPException(status_code=400, detail="unknown_template")

    # Resolve targets
    targets: list[models.User] = []
    if body.user_id or body.site_id:
        q = db.query(models.User)
        if body.user_id:
            q = q.filter(models.User.id == int(body.user_id))
        if body.site_id:
            q = q.filter(models.User.site_id == str(body.site_id))
        u = q.first()
        if not u:
            raise HTTPException(status_code=404, detail="User not found")
        targets = [u]
    elif body.segment:
        # Join with UserSegment and filter by rfm_group label
        targets = (
            db.query(models.User)
            .join(models.UserSegment, models.UserSegment.user_id == models.User.id)
            .filter(models.User.is_active == True, models.UserSegment.rfm_group == body.segment)  # noqa: E712
            .all()
        )
    else:
        raise HTTPException(status_code=400, detail="Provide user_id/site_id or segment")

    if not targets:
        return {"ok": True, "sent": 0, "targeted": 0, "template": body.template}

    svc = EmailService()
    sent = 0
    for u in targets:
        # Compose context with safe defaults
        ctx = dict(body.context or {})
        ctx.setdefault("nickname", getattr(u, "nickname", getattr(u, "site_id", "Player")))
        ctx.setdefault("bonus", 0)
        ctx.setdefault("reward", "")
        ctx.setdefault("balance", getattr(u, "cyber_token_balance", 0))
        ctx.setdefault("event_name", "Admin Announcement")
        try:
            if svc.send_template_to_user(u, body.template, ctx):
                sent += 1
        except Exception:
            # Best-effort; continue other recipients
            continue

    return {"ok": True, "sent": sent, "targeted": len(targets), "template": body.template}
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


@router.put("/users/{user_id}")
async def admin_update_user(
    user_id: int,
    body: AdminUserUpdateRequest,
    admin_user = Depends(require_admin_access),
    db: Session = Depends(get_db),
):
    """Update core user admin fields (admin only).

    This endpoint exists to satisfy tests expecting PUT /api/admin/users/{id}
    to control is_admin/is_active/user_rank with proper permission checks.
    """
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    if body.is_admin is not None:
        u.is_admin = bool(body.is_admin)
    if body.is_active is not None:
        u.is_active = bool(body.is_active)
    if body.user_rank is not None:
        u.user_rank = str(body.user_rank)

    db.add(u)
    db.commit()
    db.refresh(u)
    return {
        "id": u.id,
        "site_id": getattr(u, "site_id", None),
        "is_admin": getattr(u, "is_admin", False),
        "is_active": getattr(u, "is_active", True),
        "user_rank": getattr(u, "user_rank", None),
    }


@router.post("/users/elevate")
async def dev_elevate_user(body: ElevateRequest, db: Session = Depends(get_db)):
    """Dev-only: elevate a user by site_id to admin without auth.

    This is used only in tests to enable admin flows.
    """
    # Safety: disallow in non-development environments
    if settings.ENVIRONMENT != "development":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="dev-only endpoint")
    u = db.query(models.User).filter(models.User.site_id == body.site_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u.is_admin = True
    db.add(u)
    db.commit()
    return {"success": True, "user_id": u.id}


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
    # Clean up dependent rows to satisfy FK constraints
    try:
        db.query(RefreshToken).filter(RefreshToken.user_id == user_id).delete(synchronize_session=False)
        db.query(UserSession).filter(UserSession.user_id == user_id).delete(synchronize_session=False)
        db.flush()
    except Exception:
        db.rollback()
        raise
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

# ====== Admin Audit Logs (read-only) ======
class AuditLogParams(BaseModel):
    action: Optional[str] = Field(None, description="Filter by action, e.g., LIMITED_SET_STOCK")
    target_type: Optional[str] = Field(None, description="Filter by target type, e.g., limited_package|promo")
    target_id: Optional[str] = Field(None, description="Filter by specific target id/code")
    since: Optional[datetime] = Field(None, description="Return logs created at or after this timestamp")
    until: Optional[datetime] = Field(None, description="Return logs created before this timestamp")
    skip: int = Field(0, ge=0)
    limit: int = Field(20, ge=1, le=200)


@router.get("/audit/logs")
async def list_audit_logs(
    params: AuditLogParams = Depends(),
    admin_user = Depends(require_admin_access),
    db: Session = Depends(get_db),
):
    from app import models
    q = db.query(models.AdminAuditLog)
    if params.action:
        q = q.filter(models.AdminAuditLog.action == params.action)
    if params.target_type:
        q = q.filter(models.AdminAuditLog.target_type == params.target_type)
    if params.target_id:
        q = q.filter(models.AdminAuditLog.target_id == params.target_id)
    if params.since:
        q = q.filter(models.AdminAuditLog.created_at >= params.since)
    if params.until:
        q = q.filter(models.AdminAuditLog.created_at < params.until)
    q = q.order_by(models.AdminAuditLog.created_at.desc()).offset(params.skip).limit(params.limit)
    rows = q.all()
    def _row(r):
        return {
            "id": getattr(r, "id", None),
            "action": getattr(r, "action", None),
            "target_type": getattr(r, "target_type", None),
            "target_id": getattr(r, "target_id", None),
            "actor_user_id": getattr(r, "actor_user_id", None),
            "created_at": getattr(r, "created_at", None),
            "details": getattr(r, "details", None),
        }
    return {"items": [_row(r) for r in rows], "count": len(rows), "skip": params.skip, "limit": params.limit}


@router.get("/audit/logs.csv")
async def export_audit_logs_csv(
    params: AuditLogParams = Depends(),
    admin_user = Depends(require_admin_access),
    db: Session = Depends(get_db),
):
    from app import models
    q = db.query(models.AdminAuditLog)
    if params.action:
        q = q.filter(models.AdminAuditLog.action == params.action)
    if params.target_type:
        q = q.filter(models.AdminAuditLog.target_type == params.target_type)
    if params.target_id:
        q = q.filter(models.AdminAuditLog.target_id == params.target_id)
    if params.since:
        q = q.filter(models.AdminAuditLog.created_at >= params.since)
    if params.until:
        q = q.filter(models.AdminAuditLog.created_at < params.until)
    q = q.order_by(models.AdminAuditLog.created_at.desc()).offset(params.skip).limit(min(params.limit, 1000))
    rows = q.all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["id", "action", "target_type", "target_id", "actor_user_id", "created_at", "details"])
    for r in rows:
        writer.writerow([
            getattr(r, "id", ""),
            getattr(r, "action", ""),
            getattr(r, "target_type", ""),
            getattr(r, "target_id", ""),
            getattr(r, "actor_user_id", ""),
            getattr(r, "created_at", ""),
            getattr(r, "details", ""),
        ])
    buffer.seek(0)
    return StreamingResponse(iter([buffer.getvalue()]), media_type="text/csv", headers={
        "Content-Disposition": "attachment; filename=admin_audit_logs.csv"
    })

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

class AdminAddTokensRequest(BaseModel):
    amount: int
    reason: Optional[str] = None
    user_id: Optional[int] = None  # path param과 중복 허용(호환 목적)


@router.post("/users/{user_id}/tokens/add")
async def add_user_tokens(
    user_id: int,
    body: Optional[AdminAddTokensRequest] = None,
    amount: Optional[int] = None,  # 쿼리 파라미터 방식도 병행 지원
    admin_user = Depends(require_admin_access),
    db = Depends(get_db),
    admin_service: AdminService = Depends(get_admin_service)
):
    """Add tokens to a user account (admin only).
    - 호환성: JSON 본문({amount, reason}) 또는 쿼리 파라미터 amount 모두 지원
    """
    try:
        amt = None
        if body and body.amount is not None:
            amt = int(body.amount)
        elif amount is not None:
            amt = int(amount)

        if amt is None:
            raise HTTPException(status_code=422, detail="amount is required")
        if amt <= 0:
            raise ValueError("Amount must be positive")

        target_user_id = user_id
        # 본문에 user_id가 들어와도 path 우선, 값 불일치 시 path 기준
        new_balance = admin_service.add_user_tokens(target_user_id, amt)

        return {
            "success": True,
            "message": f"Added {amt} tokens to user {target_user_id}",
            "new_balance": new_balance,
            "admin_id": getattr(admin_user, "id", None),
            "reason": getattr(body, "reason", None) if body else None,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
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

# ====== Shop Transactions (Admin) ======
from ..services.shop_service import ShopService


@router.get("/transactions")
async def admin_list_transactions(
    limit: int = 50,
    admin_user = Depends(require_admin_access),
    db: Session = Depends(get_db),
):
    svc = ShopService(db)
    return svc.admin_search_transactions(limit=limit)


class ForceSettleRequest(BaseModel):
    outcome: str = Field("success", pattern="^(success|failed)$")


@router.post("/transactions/{receipt}/force-settle")
async def admin_force_settle(
    receipt: str,
    body: ForceSettleRequest,
    admin_user = Depends(require_admin_access),
    db: Session = Depends(get_db),
):
    svc = ShopService(db)
    res = svc.admin_force_settle(receipt, 'success' if body.outcome != 'failed' else 'failed')
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("message", "Failed"))
    return res

# ----- Limited Packages (admin) -----
class LimitedUpsertRequest(BaseModel):
    package_id: str
    name: str
    description: Optional[str] = None
    price: int
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    stock_total: Optional[int] = None
    stock_remaining: Optional[int] = None
    per_user_limit: Optional[int] = None
    emergency_disabled: Optional[bool] = None
    contents: Optional[dict] = None
    is_active: Optional[bool] = None


@router.post("/limited-packages/upsert")
async def admin_limited_upsert(
    req: LimitedUpsertRequest,
    admin_user = Depends(require_admin_access),
):
    # 메모리 서비스에 즉시 반영 (테스트/로컬 환경용)
    from ..services.limited_package_service import LimitedPackageService, LimitedPackage
    from datetime import timezone, timedelta
    now = datetime.now(timezone.utc)
    start_at = now if not req.starts_at else datetime.fromisoformat(req.starts_at)
    end_at = now + timedelta(days=30)
    if req.ends_at:
        try:
            end_at = datetime.fromisoformat(req.ends_at)
        except Exception:
            pass
    # contents에서 bonus_tokens를 gems로 활용 (테스트 컨벤션)
    bonus = 0
    try:
        bonus = int((req.contents or {}).get("bonus_tokens", 0))
    except Exception:
        bonus = 0
    pkg = LimitedPackage(
        code=req.package_id,
        name=req.name,
        description=req.description or "",
        price_cents=int(req.price),
        gems=bonus,
        start_at=start_at,
        end_at=end_at,
        per_user_limit=int(req.per_user_limit or 1),
        initial_stock=req.stock_total,
        is_active=True if req.is_active is None else bool(req.is_active),
    )
    LimitedPackageService._catalog[req.package_id] = pkg  # noqa: SLF001
    # 초기 재고/1인 제한/활성 상태 반영
    if req.per_user_limit is not None:
        LimitedPackageService.set_per_user_limit(req.package_id, int(req.per_user_limit))
    if req.stock_total is not None:
        LimitedPackageService.set_initial_stock(req.package_id, int(req.stock_total))
    if req.is_active is not None:
        LimitedPackageService.set_active(req.package_id, bool(req.is_active))
    return {"success": True, "message": "Upserted"}


@router.post("/limited-packages/{package_id}/disable")
async def admin_limited_disable(
    package_id: str,
    admin_user = Depends(require_admin_access),
):
    from ..services.limited_package_service import LimitedPackageService
    if not LimitedPackageService.set_active(package_id, False):
        raise HTTPException(status_code=404, detail="Package not found")
    return {"success": True, "message": "Disabled"}


# ----- Promo Codes (admin) -----
class PromoCodeUpsertRequest(BaseModel):
    code: str
    package_id: Optional[str] = None
    discount_type: str = "flat"  # percent | flat
    value: int = 0
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    is_active: Optional[bool] = True
    max_uses: Optional[int] = None


@router.post("/promo-codes/upsert")
async def admin_promo_upsert(
    req: PromoCodeUpsertRequest,
    admin_user = Depends(require_admin_access),
):
    # 메모리 기반 프로모 설정: 할인 금액과 최대 사용 횟수
    from ..services.limited_package_service import LimitedPackageService
    if req.package_id:
        LimitedPackageService.set_promo_discount(req.package_id, req.code, int(req.value))
    else:
        # 글로벌 코드로 취급: 모든 패키지에서 동일 코드 사용 시, 호출 시점에 필요한 패키지에 설정 필요
        pass
    LimitedPackageService.set_promo_max_uses(req.code, req.max_uses)
    return {"success": True, "message": "Upserted"}

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
    # audit log
    try:
        from app import models
        db = next(get_db())
        db.add(models.AdminAuditLog(
            actor_user_id=getattr(admin_user, 'id', None),
            action='LIMITED_SET_STOCK',
            target_type='limited_package',
            target_id=req.code,
            details={"initial_stock": req.initial_stock},
        ))
        db.commit()
    except Exception:
        pass
    return {"success": True}

@router.post("/limited/per-user-limit")
async def admin_limited_per_user_limit(req: LimitedPerUserLimitRequest, admin_user = Depends(require_admin_access)):
    ok = LimitedPackageService.set_per_user_limit(req.code, req.per_user_limit)
    if not ok:
        raise HTTPException(status_code=404, detail="Package not found")
    try:
        from app import models
        db = next(get_db())
        db.add(models.AdminAuditLog(
            actor_user_id=getattr(admin_user, 'id', None),
            action='LIMITED_SET_PER_USER',
            target_type='limited_package',
            target_id=req.code,
            details={"per_user_limit": req.per_user_limit},
        ))
        db.commit()
    except Exception:
        pass
    return {"success": True}

@router.post("/limited/promo/set")
async def admin_limited_promo_set(req: LimitedPromoRequest, admin_user = Depends(require_admin_access)):
    LimitedPackageService.set_promo_discount(req.code, req.promo_code, req.cents_off)
    try:
        from app import models
        db = next(get_db())
        db.add(models.AdminAuditLog(
            actor_user_id=getattr(admin_user, 'id', None),
            action='LIMITED_PROMO_SET',
            target_type='limited_package',
            target_id=req.code,
            details={"promo_code": req.promo_code, "cents_off": req.cents_off},
        ))
        db.commit()
    except Exception:
        pass
    return {"success": True}

@router.post("/limited/promo/clear")
async def admin_limited_promo_clear(req: LimitedPromoRequest, admin_user = Depends(require_admin_access)):
    LimitedPackageService.clear_promo_discount(req.code, req.promo_code)
    try:
        from app import models
        db = next(get_db())
        db.add(models.AdminAuditLog(
            actor_user_id=getattr(admin_user, 'id', None),
            action='LIMITED_PROMO_CLEAR',
            target_type='limited_package',
            target_id=req.code,
            details={"promo_code": req.promo_code},
        ))
        db.commit()
    except Exception:
        pass
    return {"success": True}
