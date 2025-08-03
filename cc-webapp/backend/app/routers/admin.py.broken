"""
Simple Admin API Router
Provides administrative functions for admin users
"""

from fastapi import APIRouter, Depends, HTTPException, status

from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.auth_models import User
from app.auth.auth_service import AuthService

router = APIRouter(
    prefix="/admin",
    tags=["KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED관리�KOREAN_TEXT_REMOVED"],
    responses={404: {"description": "Not found"}},
)

def get_current_admin(db = Depends(get_db)) -> User:
    """관리�KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED"""
    # KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED 구�KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED가KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED
    # 지�KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED 관리�KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED
    admin_user = db.query(User).filter(User.nickname.like("%admin%")).first()
    if not admin_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리�KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED
        )
    return admin_user

@router.get("/users")
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    db = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """모�KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED (관리�KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED)"""
    users = db.query(User).offset(skip).limit(limit).all()
    return {
        "total": len(users),
        "users": [
            {
                "id": user.id,
                "nickname": user.nickname,
                "rank": user.rank,
                "created_at": user.created_at,
                "last_login": user.last_login,
            }
            for user in users
        ]
    }

@router.get("/stats")
async def get_admin_stats(
    db = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """관리�KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED"""
    total_users = db.query(User).count()
    
    return {
        "total_users": total_users,
        "active_users": total_users,  # KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED
        "admin_count": db.query(User).filter(User.nickname.like("%admin%")).count(),
        "system_status": "healthy"
    }

@router.get("/health")
async def admin_health_check():
    """관리�KOREAN_TEXT_REMOVED API KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED"""
    return {"status": "healthy", "timestamp": datetime.now()}
