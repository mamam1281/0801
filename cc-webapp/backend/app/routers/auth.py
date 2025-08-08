"""Authentication API Router (clean)

Provides signup, login, admin login, refresh, and logout endpoints.
Delegates business logic to services.auth_service.AuthService.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.auth import UserCreate, UserLogin, AdminLogin, UserResponse, Token
from ..services.auth_service import AuthService, security
from ..models.auth_models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def _build_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        site_id=user.site_id,
        nickname=user.nickname,
        phone_number=getattr(user, "phone_number", None),
        cyber_token_balance=getattr(user, "cyber_token_balance", 0),
        created_at=user.created_at,
        last_login=user.last_login or user.created_at,
        is_admin=getattr(user, "is_admin", False),
        is_active=getattr(user, "is_active", True),
    )


@router.post("/signup", response_model=Token)
async def signup(data: UserCreate, db: Session = Depends(get_db)):
    try:
        user = AuthService.create_user(db, data)
        access_token = AuthService.create_access_token(
            {"sub": user.site_id, "user_id": user.id, "is_admin": user.is_admin}
        )
        return Token(access_token=access_token, token_type="bearer", user=_build_user_response(user))
    except HTTPException:
        raise
    except Exception:
        logger.exception("Signup error")
        raise HTTPException(status_code=500, detail="Registration processing error occurred")


@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: Session = Depends(get_db)):
    try:
        user = AuthService.authenticate_user(db, data.site_id, data.password)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        AuthService.update_last_login(db, user)
        access_token = AuthService.create_access_token(
            {"sub": user.site_id, "user_id": user.id, "is_admin": user.is_admin}
        )
        return Token(access_token=access_token, token_type="bearer", user=_build_user_response(user))
    except HTTPException:
        raise
    except Exception:
        logger.exception("Login error")
        raise HTTPException(status_code=500, detail="Login processing error occurred")


@router.post("/admin/login", response_model=Token)
async def admin_login(data: AdminLogin, db: Session = Depends(get_db)):
    try:
        user = AuthService.authenticate_admin(db, data.site_id, data.password)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin credentials")
        AuthService.update_last_login(db, user)
        access_token = AuthService.create_access_token(
            {"sub": user.site_id, "user_id": user.id, "is_admin": True}
        )
        return Token(access_token=access_token, token_type="bearer", user=_build_user_response(user))
    except HTTPException:
        raise
    except Exception:
        logger.exception("Admin login error")
        raise HTTPException(status_code=500, detail="Admin login processing error occurred")


@router.post("/refresh", response_model=Token)
async def refresh(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    try:
        token_data = AuthService.verify_token(credentials.credentials)
        user = db.query(User).filter(User.id == token_data.user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        new_access_token = AuthService.create_access_token(
            {"sub": user.site_id, "user_id": user.id, "is_admin": user.is_admin}
        )
        return Token(access_token=new_access_token, token_type="bearer", user=_build_user_response(user))
    except HTTPException:
        raise
    except Exception:
        logger.exception("Token refresh error")
        raise HTTPException(status_code=500, detail="Token refresh processing error occurred")


@router.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # Stateless JWT: simply acknowledge; implement blacklist if needed.
    return {"message": "Logged out"}
