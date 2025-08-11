"""Authentication API Router (clean)

Provides signup, login, admin login, refresh, and logout endpoints.
Delegates business logic to services.auth_service.AuthService.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.auth import UserCreate, UserLogin, AdminLogin, UserResponse, Token
from ..services.auth_service import AuthService, security
from ..models.auth_models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def _build_user_response(user: User) -> UserResponse:
    # Only include fields that exist in UserResponse schema
    return UserResponse(
        id=user.id,
        site_id=user.site_id,
        nickname=user.nickname,
        phone_number=getattr(user, "phone_number", None),
        is_active=getattr(user, "is_active", True),
        is_admin=getattr(user, "is_admin", False),
        created_at=user.created_at,
        last_login=user.last_login,
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
    # Body로 {"refresh_token": "..."} 를 받는 것도 허용 (FE 호환)
    refresh_token: str | None = Body(default=None, embed=True),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    try:
        # 우선순위: Body.refresh_token -> Authorization Bearer
        provided_token = refresh_token or (credentials.credentials if credentials else None)
        if not provided_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token required")

        token_data = AuthService.verify_token(provided_token)
        user = db.query(User).filter(User.id == token_data.user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        new_access_token = AuthService.create_access_token(
            {"sub": user.site_id, "user_id": user.id, "is_admin": user.is_admin}
        )
        return Token(access_token=new_access_token, token_type="bearer", user=_build_user_response(user), refresh_token=provided_token)
    except HTTPException:
        raise
    except Exception:
        logger.exception("Token refresh error")
        raise HTTPException(status_code=500, detail="Token refresh processing error occurred")


@router.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # Stateless JWT: simply acknowledge; implement blacklist if needed.
    return {"message": "Logged out"}


@router.get("/check-invite/{code}")
async def check_invite(code: str, db: Session = Depends(get_db)):
    """Invite code validation.
    - Code '5858' is always valid and infinitely reusable.
    - For other codes, respond as not implemented yet (reserved for future repository-backed logic).
    """
    if code == "5858":
        return {"code": code, "valid": True, "infinite": True}
    # Placeholder response for non-5858 codes (can be wired to InviteCodeRepository later)
    return {"code": code, "valid": False, "reason": "UNKNOWN_OR_UNSUPPORTED_CODE"}


@router.get("/me", response_model=UserResponse)
async def me(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials if credentials else None
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    token_data = AuthService.verify_token(token)
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return _build_user_response(user)
