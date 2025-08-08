"""Simple Admin API Router - Provides administrative functions for admin users"""

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, Body
from pydantic import BaseModel

from ..database import get_db
from ..dependencies import get_current_user
from ..services.admin_service import AdminService
from ..websockets import manager
from ..services.reward_service import RewardService

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

class AdminUserListResponse(BaseModel):
    items: List[dict]
    page: int
    page_size: int
    total: int

class AdminUserDetailResponse(BaseModel):
    user: dict
    balances: dict
    flags: List[dict] = []
    recent: dict = {}

class AdminNotificationRequest(BaseModel):
    """Payload to send an admin notification"""
    title: str
    body: str
    user_id: Optional[int] = None  # required for targeted send
    data: Optional[dict] = None

class BulkRewardItem(BaseModel):
    user_id: int
    reward_type: str
    amount: int
    source_description: Optional[str] = None

class BulkRewardRequest(BaseModel):
    items: List[BulkRewardItem]

class BulkRewardResult(BaseModel):
    success: bool
    results: List[dict]

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
        raise HTTPException(status_code=500, detail=f"Failed to get admin stats: {e}")

@router.get("/users", response_model=AdminUserListResponse)
async def list_users(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    admin_user = Depends(require_admin_access),
    db = Depends(get_db),
    admin_service: AdminService = Depends(get_admin_service)
):
    try:
        skip = (page - 1) * page_size
        items = admin_service.list_users(skip, page_size, search)
        # total 계산 간단화(검색 조건 동일하게 적용 시 별도 total 쿼리 필요)
        total = db.query(AdminService.db.model.classes['User'] if False else type(items[0]) if items else type(None)).count() if False else 0
        # 간결한 직렬화(필요 필드만)
        serialized = [
            {
                "id": u.id,
                "site_id": u.site_id,
                "nickname": u.nickname,
                "vip_tier": getattr(u, 'vip_tier', 0),
                "is_active": getattr(u, 'is_active', True),
                "tokens": getattr(u, 'cyber_token_balance', 0),
                "gems": getattr(u, 'gems_balance', 0),
                "gold": getattr(u, 'gold_balance', 0),
                "risk_profile": getattr(u, 'risk_profile', None),
                "created_at": u.created_at,
                "last_login": getattr(u, 'last_login', None),
            }
            for u in items
        ]
        return {"items": serialized, "page": page, "page_size": page_size, "total": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list users: {e}")

    @router.post("/notifications/send")
    async def send_notification(
        payload: AdminNotificationRequest,
        admin_user = Depends(require_admin_access),
    ):
        """Send a notification to a specific user via WebSocket."""
        if not payload.user_id:
            raise HTTPException(status_code=400, detail="user_id is required for targeted send")
        message = {
            "type": "ADMIN_NOTIFICATION",
            "payload": {
                "title": payload.title,
                "body": payload.body,
                "data": payload.data or {},
            },
            "meta": {"by": getattr(admin_user, 'id', None)},
        }
        try:
            await manager.send_personal_message(message, payload.user_id)
            return {"success": True}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to send: {e}")

    @router.post("/notifications/broadcast")
    async def broadcast_notification(
        payload: AdminNotificationRequest,
        admin_user = Depends(require_admin_access),
    ):
        """Broadcast a notification to all connected users via WebSocket."""
        message = {
            "type": "ADMIN_BROADCAST",
            "payload": {
                "title": payload.title,
                "body": payload.body,
                "data": payload.data or {},
            },
            "meta": {"by": getattr(admin_user, 'id', None)},
        }
        try:
            await manager.broadcast(message)
            return {"success": True}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to broadcast: {e}")

    @router.post("/rewards/grant-bulk", response_model=BulkRewardResult)
    async def grant_rewards_bulk(
        payload: BulkRewardRequest,
        admin_user = Depends(require_admin_access),
        db = Depends(get_db),
    ):
        """Grant rewards to many users in one call. Returns per-user results."""
        if not payload.items:
            raise HTTPException(status_code=400, detail="items cannot be empty")
        service = RewardService(db)
        results: List[dict] = []
        for item in payload.items:
            try:
                reward = service.distribute_reward(
                    user_id=item.user_id,
                    reward_type=item.reward_type,
                    amount=item.amount,
                    source_description=item.source_description or f"admin:{getattr(admin_user, 'id', None)}",
                )
                results.append({
                    "user_id": item.user_id,
                    "status": "ok",
                    "reward_id": reward.id,
                    "awarded_at": getattr(reward, 'awarded_at', None),
                })
            except Exception as e:
                results.append({
                    "user_id": item.user_id,
                    "status": "error",
                    "error": str(e),
                })
        success = all(r.get("status") == "ok" for r in results)
        return {"success": success, "results": results}

@router.get("/users/{user_id}", response_model=AdminUserDetailResponse)
async def get_user_detail(
    user_id: int = Path(..., ge=1),
    admin_user = Depends(require_admin_access),
    db = Depends(get_db),
    admin_service: AdminService = Depends(get_admin_service)
):
    user = admin_service.get_user_details(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 최근 활동/보상 요약(경량)
    activities = admin_service.get_user_activities(user_id, limit=10)
    rewards = admin_service.get_user_rewards(user_id, limit=10)
    return {
        "user": {
            "id": user.id,
            "site_id": user.site_id,
            "nickname": user.nickname,
            "vip_tier": getattr(user, 'vip_tier', 0),
            "is_active": getattr(user, 'is_active', True),
            "risk_profile": getattr(user, 'risk_profile', None),
            "segment": getattr(user, 'segment', None),
            "created_at": user.created_at,
            "last_login": getattr(user, 'last_login', None),
        },
        "balances": {
            "tokens": getattr(user, 'cyber_token_balance', 0),
            "gems": getattr(user, 'gems_balance', 0),
            "gold": getattr(user, 'gold_balance', 0),
        },
        "flags": [],
        "recent": {
            "activities": [
                {"id": a.id, "type": a.action_type, "at": a.created_at}
                for a in activities
            ],
            "rewards": [
                {"id": r.id, "type": r.reward_type, "at": r.awarded_at}
                for r in rewards
            ],
        },
    }

@router.get("/users/{user_id}/activities")
async def get_user_activities(
    user_id: int = Path(..., ge=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    admin_user = Depends(require_admin_access),
    admin_service: AdminService = Depends(get_admin_service)
):
    skip = (page - 1) * page_size
    items = admin_service.get_user_activities(user_id, limit=page_size)
    return {"items": [
        {"id": a.id, "type": a.action_type, "data": a.action_data, "at": a.created_at}
        for a in items
    ], "page": page, "page_size": page_size}

@router.patch("/users/{user_id}")
async def patch_user(
    user_id: int = Path(..., ge=1),
    payload: dict = Body(...),
    admin_user = Depends(require_admin_access),
    admin_service: AdminService = Depends(get_admin_service)
):
    try:
        user = admin_service.update_user_partial(user_id, payload)
        return {"id": user.id, "nickname": user.nickname, "is_active": user.is_active, "vip_tier": getattr(user, 'vip_tier', 0)}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update user: {e}")

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
