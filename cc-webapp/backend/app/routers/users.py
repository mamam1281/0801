"""User Management API Endpoints"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from ..database import get_db
from ..models.auth_models import User
from ..dependencies import get_current_user, require_min_tier
from ..services.user_service import UserService
from ..schemas.user import UserResponse, UserUpdate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/users", tags=["Users"])  # "users"를 "Users"로 변경하여 일관성 유지

class UserProfileResponse(BaseModel):
    """User profile response"""
    id: int
    site_id: str
    nickname: str
    phone_number: str
    cyber_token_balance: int
    is_admin: bool
    is_active: bool

class UserStatsResponse(BaseModel):
    """User statistics response"""
    total_games_played: int
    total_tokens_earned: int
    total_tokens_spent: int
    win_rate: float
    level: int
    experience: int

# Dependency injection
def get_user_service(db = Depends(get_db)) -> UserService:
    """User service dependency"""
    return UserService(db)

# API endpoints
@router.get("/profile", response_model=UserResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """현재 로그인한 사용자 프로필 조회"""
    logger.info(f"API: GET /api/users/profile - user_id={current_user.id}")
    return current_user

@router.put("/profile", response_model=UserProfileResponse)
async def update_user_profile(
    update_data: UserUpdate,
    current_user = Depends(get_current_user),
    db = Depends(get_db),
    user_service: UserService = Depends(get_user_service)
):
    """Update user profile"""
    try:
        updated_user = user_service.update_user(current_user.id, update_data.dict(exclude_unset=True))
        return UserProfileResponse(
            id=updated_user.id,
            site_id=updated_user.site_id,
            nickname=updated_user.nickname,
            phone_number=updated_user.phone_number,
            cyber_token_balance=updated_user.cyber_token_balance,
            is_admin=updated_user.is_admin,
            is_active=updated_user.is_active
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile update failed: {str(e)}"
        )

@router.get("/balance")
async def get_user_balance(
    current_user: User = Depends(get_current_user)
):
    """사용자 잔액 조회"""
    logger.info(f"API: GET /api/users/balance - user_id={current_user.id}")
    return {
        "cyber_token_balance": current_user.cyber_token_balance,
        "user_id": current_user.id,
        "nickname": current_user.nickname
    }

@router.get("/info")
async def get_user_info(
    current_user: User = Depends(get_current_user)
):
    """사용자 상세 정보 조회"""
    logger.info(f"API: GET /api/users/info - user_id={current_user.id}")
    return {
        "id": current_user.id,
        "site_id": current_user.site_id,
        "nickname": current_user.nickname,
        "phone_number": current_user.phone_number,
        "cyber_token_balance": current_user.cyber_token_balance,
        "rank": getattr(current_user, 'rank', 'STANDARD'),
        "is_admin": current_user.is_admin,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
        "last_login": current_user.last_login
    }

@router.get("/stats", response_model=UserStatsResponse)
async def get_user_stats(
    current_user = Depends(get_current_user),
    db = Depends(get_db),
    user_service: UserService = Depends(get_user_service)
):
    """Get user statistics"""
    logger.info(f"API: GET /api/users/stats - user_id={current_user.id}")
    try:
        stats = user_service.get_user_stats(current_user.id)
        return UserStatsResponse(
            total_games_played=getattr(stats, 'total_games_played', 0),
            total_tokens_earned=getattr(stats, 'total_tokens_earned', 0),
            total_tokens_spent=getattr(stats, 'total_tokens_spent', 0),
            win_rate=getattr(stats, 'win_rate', 0.0),
            level=getattr(stats, 'level', 1),
            experience=getattr(stats, 'experience', 0)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Stats retrieval failed: {str(e)}"
        )



@router.post("/tokens/add")
async def add_tokens(
    amount: int,
    current_user = Depends(get_current_user),
    db = Depends(get_db),
    user_service: UserService = Depends(get_user_service)
):
    """Add tokens to user account (admin or special purposes)"""
    try:
        if amount <= 0:
            raise ValueError("Amount must be positive")
        updated_balance = user_service.add_tokens(current_user.id, amount)
        return {
            "success": True,
            "message": f"Added {amount} tokens",
            "new_balance": updated_balance,
            "user_id": current_user.id
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token addition failed: {str(e)}"
        )

@router.get("/vip-only")
async def vip_only_feature(
    current_user: User = Depends(require_min_tier("VIP")),
):
    """Example VIP-only endpoint to validate tier-based access control."""
    return {"ok": True, "user_id": current_user.id, "tier": getattr(current_user, "user_rank", "STANDARD")}

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    """특정 사용자 정보 조회"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    return user
