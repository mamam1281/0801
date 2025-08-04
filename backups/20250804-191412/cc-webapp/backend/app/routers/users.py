"""User Management API Endpoints"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List

from ..database import get_db
from ..dependencies import get_current_user
from ..services.user_service import UserService
from ..schemas.user import UserResponse, UserUpdate

router = APIRouter(prefix="/api/users", tags=["users"])

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
@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get current user profile"""
    try:
        return UserProfileResponse(
            id=current_user.id,
            site_id=current_user.site_id,
            nickname=current_user.nickname,
            phone_number=current_user.phone_number,
            cyber_token_balance=current_user.cyber_token_balance,
            is_admin=current_user.is_admin,
            is_active=current_user.is_active
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile retrieval failed: {str(e)}"
        )

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

@router.get("/stats", response_model=UserStatsResponse)
async def get_user_stats(
    current_user = Depends(get_current_user),
    db = Depends(get_db),
    user_service: UserService = Depends(get_user_service)
):
    """Get user statistics"""
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

@router.get("/balance")
async def get_user_balance(
    current_user = Depends(get_current_user)
):
    """Get user token balance"""
    try:
        return {
            "user_id": current_user.id,
            "cyber_token_balance": current_user.cyber_token_balance,
            "nickname": current_user.nickname
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Balance retrieval failed: {str(e)}"
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
