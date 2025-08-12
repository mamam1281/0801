"""Authentication API Router (clean)

Provides signup, login, admin login, refresh, and logout endpoints.
Delegates business logic to services.auth_service.AuthService.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Body, Request
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.auth import UserCreate, UserLogin, AdminLogin, UserResponse, Token
from ..schemas.token import RefreshTokenRequest
from ..services.auth_service import AuthService, security
from ..auth.token_manager import TokenManager
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
async def signup(data: UserCreate, request: Request, db: Session = Depends(get_db)):
    try:
        user = AuthService.create_user(db, data)
        access_token = AuthService.create_access_token(
            {"sub": user.site_id, "user_id": user.id, "is_admin": user.is_admin}
        )
        try:
            AuthService.create_session(db, user, access_token, request)
        except Exception:
            logger.exception("create_session (signup) failed (non-fatal)")
        # DB 기반 리프레시 토큰 발급 및 저장
        try:
            ip = request.client.host if request and request.client else None
            ua = request.headers.get("User-Agent") if request else None
            refresh_token = TokenManager.create_refresh_token(user_id=user.id, ip_address=ip or "", user_agent=ua or "", db=db)
        except Exception:
            logger.exception("refresh_token create/save failed (signup) - continuing without refresh_token")
            refresh_token = None
        return Token(access_token=access_token, token_type="bearer", user=_build_user_response(user), refresh_token=refresh_token)
    except HTTPException:
        raise
    except Exception:
        logger.exception("Signup error")
        raise HTTPException(status_code=500, detail="Registration processing error occurred")


@router.post("/login", response_model=Token)
async def login(data: UserLogin, request: Request, db: Session = Depends(get_db)):
    try:
        # Lockout check
        if AuthService.is_login_locked(db, data.site_id):
            AuthService.record_login_attempt(
                db,
                site_id=data.site_id,
                success=False,
                ip_address=request.client.host if request and request.client else None,
                user_agent=request.headers.get("User-Agent") if request else None,
                failure_reason="locked_out",
            )
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many failed attempts")
        user = AuthService.authenticate_user(db, data.site_id, data.password)
        if not user:
            # Record failure
            AuthService.record_login_attempt(
                db,
                site_id=data.site_id,
                success=False,
                ip_address=request.client.host if request and request.client else None,
                user_agent=request.headers.get("User-Agent") if request else None,
                failure_reason="invalid_credentials",
            )
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        AuthService.update_last_login(db, user)
        # Record success
        AuthService.record_login_attempt(
            db,
            site_id=data.site_id,
            success=True,
            ip_address=request.client.host if request and request.client else None,
            user_agent=request.headers.get("User-Agent") if request else None,
        )
        access_token = AuthService.create_access_token(
            {"sub": user.site_id, "user_id": user.id, "is_admin": user.is_admin}
        )
        try:
            AuthService.create_session(db, user, access_token, request)
        except Exception:
            logger.exception("create_session (login) failed (non-fatal)")
        # DB 기반 리프레시 토큰 발급 및 저장
        try:
            ip = request.client.host if request and request.client else None
            ua = request.headers.get("User-Agent") if request else None
            refresh_token = TokenManager.create_refresh_token(user_id=user.id, ip_address=ip or "", user_agent=ua or "", db=db)
        except Exception:
            logger.exception("refresh_token create/save failed (login) - continuing without refresh_token")
            refresh_token = None
        return Token(access_token=access_token, token_type="bearer", user=_build_user_response(user), refresh_token=refresh_token)
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
        try:
            AuthService.create_session(db, user, access_token, None)
        except Exception:
            logger.exception("create_session (admin) failed (non-fatal)")
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
    request: Request = None,
    db: Session = Depends(get_db),
):
    try:
        # 우선순위: Body.refresh_token -> Authorization Bearer
        provided_token = refresh_token or (credentials.credentials if credentials else None)
        if not provided_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token required")
        # 1) DB 리프레시 토큰 경로 시도
        user = None
        try:
            req_ip = request.client.host if request and request.client else ""
            req_ua = request.headers.get("User-Agent") if request else ""
            ok, uid, err = TokenManager.verify_refresh_token(provided_token, req_ip, req_ua, db)
            if ok and uid:
                user = db.query(User).filter(User.id == uid).first()
        except Exception:
            logger.exception("DB refresh_token verify failed; will fallback to JWT verify")
        # 2) 기존 JWT verify fallback (이전 즉시 재발급 전략 호환)
        if user is None:
            token_data = AuthService.verify_token(provided_token, db=db)
            user = db.query(User).filter(User.id == token_data.user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        new_access_token = AuthService.create_access_token(
            {"sub": user.site_id, "user_id": user.id, "is_admin": user.is_admin}
        )
        try:
            # Create a session for the refreshed token so it is accepted by session checks
            AuthService.create_session(db, user, new_access_token, None)
        except Exception:
            logger.exception("create_session (refresh) failed (non-fatal)")
        # 리프레시 토큰 회전(있으면), 실패 시 기존 토큰 유지
        new_refresh_token = None
        try:
            req_ip = request.client.host if request and request.client else ""
            req_ua = request.headers.get("User-Agent") if request else ""
            new_refresh_token = TokenManager.rotate_refresh_token(provided_token, user.id, req_ip, req_ua, db)
        except Exception:
            logger.exception("refresh_token rotation failed; returning provided token")
        return Token(access_token=new_access_token, token_type="bearer", user=_build_user_response(user), refresh_token=(new_refresh_token or provided_token))
    except HTTPException:
        raise
    except Exception:
        logger.exception("Token refresh error")
        raise HTTPException(status_code=500, detail="Token refresh processing error occurred")


@router.post("/logout")
async def logout(
    body: RefreshTokenRequest | None = Body(default=None),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    # Blacklist current access token
    try:
        AuthService.blacklist_token(db, credentials.credentials, reason="logout")
    except Exception:
        logger.exception("logout blacklist failed")
    # Revoke provided refresh token if present
    try:
        if body and body.refresh_token:
            TokenManager.revoke_refresh_token(body.refresh_token, db)
    except Exception:
        logger.exception("logout refresh revoke failed")
    return {"message": "Logged out"}

@router.post("/logout-all")
async def logout_all(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    # Blacklist current token and revoke all sessions/tokens for this user
    token_data = AuthService.verify_token(credentials.credentials, db=db)
    try:
        AuthService.blacklist_token(db, credentials.credentials, reason="logout_all", by_user_id=token_data.user_id)
        AuthService.revoke_all_sessions(db, token_data.user_id)
        TokenManager.revoke_all_refresh_tokens(token_data.user_id, db)
    except Exception:
        logger.exception("logout_all failed")
    return {"message": "Logged out from all sessions"}


@router.get("/me", response_model=UserResponse)
async def me(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """Alias to current user profile for clients expecting /api/auth/me."""
    token_data = AuthService.verify_token(credentials.credentials, db=db)
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return _build_user_response(user)
