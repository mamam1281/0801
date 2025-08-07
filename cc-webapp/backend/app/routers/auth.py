"""Authentication Router for Casino-Club F2P

This module handles authentication endpoints including:
- User login/logout
- Admin login
- Token refresh
- Session management
"""

from datetime import datetime
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..services.auth_service import AuthService
from ..database import get_db
from ..schemas.auth import (
    UserCreate,
    UserLogin,
    AdminLogin,
    UserResponse,
    Token
)
from ..models.auth_models import User
from ..config import settings

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

# Initialize router and security scheme
router = APIRouter(
    prefix="/api/auth",
    tags=["authentication"],
    responses={401: {"description": "Authentication failed"}}
)
security = HTTPBearer()

def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    """Create and return an instance of AuthService"""
    return AuthService(db)

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Handle user login"""
    try:
        user = auth_service.authenticate_user(
            form_data.username,
            form_data.password
        )
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password",
                headers={"WWW-Authenticate": "Bearer"}
            )
            
        token_data = {
            "sub": str(user.id),
            "site_id": user.site_id,
            "is_admin": user.is_admin
        }
        access_token = auth_service.create_access_token(token_data)
        
        user.last_login = datetime.utcnow()
        auth_service.db.commit()
        
        user_response = UserResponse(
            id=user.id,
            site_id=user.site_id,
            nickname=user.nickname,
            phone_number=user.phone_number,
            cyber_token_balance=user.cyber_token_balance,
            created_at=user.created_at,
            last_login=user.last_login,
            is_admin=user.is_admin,
            is_active=user.is_active
        )
        
        logger.info(f"User logged in successfully: {user.site_id}")
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during login"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during login"
        )

@router.post("/admin/login", response_model=Token)
async def admin_login(
    form_data: AdminLogin,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Handle admin login"""
    try:
        # Authenticate admin
        user = auth_service.authenticate_admin(
            form_data.site_id,
            form_data.password
        )
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials or insufficient permissions",
                headers={"WWW-Authenticate": "Bearer"}
            )
            
        # Generate token
        token_data = {
            "sub": str(user.id),
            "site_id": user.site_id,
            "is_admin": True
        }
        access_token = auth_service.create_access_token(token_data)
        
        # Update login timestamp
        user.last_login = datetime.utcnow()
        auth_service.db.commit()
        
        # Prepare response
        user_response = UserResponse(
            id=user.id,
            site_id=user.site_id,
            nickname=user.nickname,
            phone_number=user.phone_number,
            cyber_token_balance=user.cyber_token_balance,
            created_at=user.created_at,
            last_login=user.last_login,
            is_admin=user.is_admin,
            is_active=user.is_active
        )
        
        logger.info(f"Admin logged in successfully: {user.site_id}")
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin login failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during admin login"
        )

@router.post("/refresh", response_model=Token)
async def refresh_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Refresh access token"""
    try:
        # Verify current token
        token_data = auth_service.verify_token(credentials.credentials)
        
        # Get user
        user = auth_service.db.query(User).filter(
            User.id == int(token_data["sub"])
        ).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
            
        # Generate new token
        token_data = {
            "sub": str(user.id),
            "site_id": user.site_id,
            "is_admin": user.is_admin
        }
        access_token = auth_service.create_access_token(token_data)
        
        # Prepare response
        user_response = UserResponse(
            id=user.id,
            site_id=user.site_id,
            nickname=user.nickname,
            phone_number=user.phone_number,
            cyber_token_balance=user.cyber_token_balance,
            created_at=user.created_at,
            last_login=user.last_login,
            is_admin=user.is_admin,
            is_active=user.is_active
        )
        
        logger.info(f"Token refreshed for user: {user.site_id}")
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during token refresh"
        )

@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Handle user logout"""
    try:
        # Verify and blacklist token
        token_data = auth_service.verify_token(credentials.credentials)
        auth_service.blacklist_token(
            credentials.credentials,
            reason="logout",
            user_id=token_data["sub"]
        )
        
        logger.info(f"User logged out: {token_data['sub']}")
        return {"message": "Logged out successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Logout failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during logout"
        )
):
    """User login endpoint"""
    try:
        # Authenticate user
        user = auth_service.authenticate_user(
            form_data.username,
            form_data.password
        )
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Create access token
        access_token = auth_service.create_access_token({
            "sub": str(user.id),
            "site_id": user.site_id,
            "is_admin": user.is_admin
        })
        
        # Update last login time
        user.last_login = datetime.utcnow()
        auth_service.db.commit()
        
        # Create response
        user_response = UserResponse(
            id=user.id,
            site_id=user.site_id,
            nickname=user.nickname,
            phone_number=user.phone_number,
            cyber_token_balance=user.cyber_token_balance,
            created_at=user.created_at,
            last_login=user.last_login,
            is_admin=user.is_admin,
            is_active=user.is_active
        )
        
        logger.info(f"Login successful for user: {user.site_id}")
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error during login process"
        )

@router.post("/admin/login", response_model=Token)
async def admin_login(
    form_data: AdminLogin,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Admin login endpoint"""
    try:
        # Authenticate admin
        user = auth_service.authenticate_admin(
            form_data.site_id,
            form_data.password
        )
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password or not admin",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Create access token
        access_token = auth_service.create_access_token({
            "sub": str(user.id),
            "site_id": user.site_id,
            "is_admin": True
        })
        
        # Update last login time
        user.last_login = datetime.utcnow()
        auth_service.db.commit()
        
        # Create response
        user_response = UserResponse(
            id=user.id,
            site_id=user.site_id,
            nickname=user.nickname,
            phone_number=user.phone_number,
            cyber_token_balance=user.cyber_token_balance,
            created_at=user.created_at,
            last_login=user.last_login,
            is_admin=user.is_admin,
            is_active=user.is_active
        )
        
        logger.info(f"Admin login successful for user: {user.site_id}")
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error during admin login process"
        )

@router.post("/refresh")
async def refresh_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Refresh access token"""
    try:
        # Verify current token
        token_data = auth_service.verify_token(credentials.credentials)
        
        # Get user
        user = auth_service.db.query(User).filter(
            User.id == int(token_data["sub"])
        ).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        # Create new access token
        access_token = auth_service.create_access_token({
            "sub": str(user.id),
            "site_id": user.site_id,
            "is_admin": user.is_admin
        })
        
        # Create response
        user_response = UserResponse(
            id=user.id,
            site_id=user.site_id,
            nickname=user.nickname,
            phone_number=user.phone_number,
            cyber_token_balance=user.cyber_token_balance,
            created_at=user.created_at,
            last_login=user.last_login,
            is_admin=user.is_admin,
            is_active=user.is_active
        )
        
        logger.info(f"Token refresh successful for user: {user.site_id}")
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error during token refresh"
        )

@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Logout endpoint"""
    try:
        # Add token to blacklist
        token_data = auth_service.verify_token(credentials.credentials)
        auth_service.blacklist_token(
            credentials.credentials,
            reason="logout",
            user_id=token_data["sub"]
        )
        
        logger.info(f"Logout successful for user ID: {token_data['sub']}")
        return {"message": "Successfully logged out"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error during logout process"
        )
):
    """User login endpoint"""
    user = auth_service.authenticate_user(form_data.site_id, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    # 액세스 토큰 생성
    access_token_data = {
        "sub": str(user.id),
        "site_id": user.site_id,
        "is_admin": user.is_admin
    }
    access_token = auth_service.create_access_token(access_token_data)
    
    # 리프레시 토큰 생성
    refresh_token_data = {
        "sub": str(user.id),
        "site_id": user.site_id
    }
    refresh_token = auth_service.create_refresh_token(refresh_token_data)
    
    # 응답
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/admin/login", response_model=Token)
async def admin_login(
    form_data: AdminLogin,
    auth_service: AuthService = Depends(get_auth_service),
    request: Request = None
):
    """관리자 로그인"""
    user = auth_service.authenticate_admin(form_data.site_id, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password or not admin"
        )
    
    # 액세스 토큰 생성
    access_token_data = {
        "sub": str(user.id),
        "site_id": user.site_id,
        "is_admin": True
    }
    access_token = auth_service.create_access_token(access_token_data)
    
    # 리프레시 토큰 생성
    refresh_token_data = {
        "sub": str(user.id),
        "site_id": user.site_id,
        "is_admin": True
    }
    refresh_token = auth_service.create_refresh_token(refresh_token_data)
    
    # 응답
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_request: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """리프레시 토큰으로 새 액세스 토큰 발급"""
    try:
        # 리프레시 토큰 검증
        payload = auth_service.verify_refresh_token(refresh_request.refresh_token)
        
        # 새 액세스 토큰 생성
        access_token_data = {
            "sub": payload["sub"],
            "site_id": payload["site_id"]
        }
        if "is_admin" in payload:
            access_token_data["is_admin"] = payload["is_admin"]
            
        new_access_token = auth_service.create_access_token(access_token_data)
        
        # 유저 정보 조회
        user_id = int(payload["sub"])
        user = auth_service.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # 응답
        return {
            "access_token": new_access_token,
            "refresh_token": refresh_request.refresh_token,  # 기존 리프레시 토큰 유지
            "token_type": "bearer",
            "user": user
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate refresh token: {str(e)}"
        )

@router.post("/logout")
async def logout(
    logout_request: LogoutRequest,
    auth_service: AuthService = Depends(get_auth_service),
    current_user: User = Depends(get_current_user)
):
    """로그아웃 - 토큰 블랙리스트 추가"""
    # 현재 액세스 토큰 블랙리스트에 추가
    token = auth_service.blacklist_token(logout_request.refresh_token, reason="logout")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not blacklist token"
        )
    
    return {"message": "Successfully logged out"}

"""
Features:
- User registration with invitation code
- Username/password login
- JWT token management (access + refresh)
- Session management and security
- Token blacklist
- Logout
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, OAuth2PasswordRequestForm
from ..models.auth import InviteCode
from ..config import settings
from sqlalchemy.orm import Session

from ..auth.auth_service import AuthService
from ..database import get_db
from ..schemas.auth import (
    UserCreate, UserLogin, AdminLogin, UserResponse, Token,
    RefreshTokenRequest, LogoutRequest
)
from ..models.auth_models import User
from ..config import settings
from ..dependencies import get_current_user, get_current_admin_user

# 로깅 설정
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# 콘솔 로그 핸들러 설정
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

# HTTP 보안 스키마
security = HTTPBearer()

# Router definition
router = APIRouter(
    prefix="/api/auth",
    tags=["authentication"]
)

class AuthHandler:
    def __init__(self, db: Session):
        self.db = db

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        try:
            to_encode = data.copy()
            expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.jwt_expire_minutes))
            to_encode.update({"exp": expire})
            encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
            return encoded_jwt
        except Exception as e:
            logger.error(f"토큰 생성 중 오류 발생: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="토큰 생성 중 오류가 발생했습니다."
            )
    
    def create_user(self, user_data: UserCreate) -> User:
        """새로운 사용자 생성"""
        # 초대 코드 확인
        invite_code = self.db.query(InviteCode).filter(
            InviteCode.code == user_data.invite_code,
            InviteCode.is_active == True
        ).first()
        
        if not invite_code or (invite_code.code != "5858" and invite_code.is_used):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="유효하지 않은 초대 코드입니다."
            )
            
        # 비밀번호 유효성 검사
        if len(user_data.password) < 4:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="비밀번호는 4자리 이상이어야 합니다."
            )
            
        # 중복 검사
        if self.db.query(User).filter(User.site_id == user_data.site_id).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 사용 중인 아이디입니다."
            )
        if self.db.query(User).filter(User.nickname == user_data.nickname).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 사용 중인 닉네임입니다."
            )
        if self.db.query(User).filter(User.phone_number == user_data.phone_number).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 등록된 전화번호입니다."
            )
            
        # 사용자 생성
        hashed_password = self.pwd_context.hash(user_data.password)
        user = User(
            site_id=user_data.site_id,
            password_hash=hashed_password,
            nickname=user_data.nickname,
            phone_number=user_data.phone_number,
            invite_code=user_data.invite_code
        )
        
        try:
            self.db.add(user)
            # 초대 코드가 5858이 아닌 경우에만 used 처리
            if invite_code.code != "5858":
                invite_code.is_used = True
                invite_code.used_by_user_id = user.id
                invite_code.used_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(user)
            return user
        except Exception as e:
            self.db.rollback()
            logger.error(f"회원가입 처리 중 오류 발생: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="회원가입 처리 중 오류가 발생했습니다."
            )

# OAuth2 schema
oauth2_scheme = HTTPBearer()

# Configuration values
JWT_EXPIRE_MINUTES = settings.jwt_expire_minutes
INITIAL_CYBER_TOKENS = getattr(settings, 'initial_cyber_tokens', 200)

# 라우터 설정
router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
    responses={401: {"description": "인증 오류"}}
)

# 인증 서비스 의존성
def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)

@router.post("/signup", response_model=Token)
async def signup(
    data: UserCreate,
    db: Session = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service)
):
    """사용자 등록 (회원가입)
    
    - site_id와 nickname을 이용한 회원가입
    - 비밀번호는 4글자 이상
    - 초대 코드 '5858' 사용
    """
    try:
        logger.info(f"회원가입 시도: site_id={data.site_id}, nickname={data.nickname}")
        
        # 비밀번호 검증
        if len(data.password) < 4:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="비밀번호는 4글자 이상이어야 합니다"
            )
        
        # 사용자 생성
        user = auth_service.create_user(data)
        
        # JWT 토큰 생성
        access_token = auth_service.create_access_token({
            "sub": user.site_id,
            "user_id": user.id,
            "is_admin": user.is_admin
        })
        
        # 응답 데이터 생성
        user_response = UserResponse(
            id=user.id,
            site_id=user.site_id,
            nickname=user.nickname,
            phone_number=user.phone_number,
            cyber_token_balance=user.cyber_token_balance,
            created_at=user.created_at,
            last_login=user.last_login or user.created_at,  # last_login이 None이면 created_at 사용
            is_admin=user.is_admin,
            is_active=user.is_active
        )
        
        logger.info(f"회원가입 성공: user_id={user.id}")
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"회원가입 오류: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="회원가입 처리 중 오류가 발생했습니다"
        )

# 로그인 라우터 수정 - 올바른 응답 포맷으로 변경
@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service)
):
    """사용자 로그인"""
    try:
        # 사용자 인증
        user = auth_service.authenticate_user(form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="아이디 또는 비밀번호가 잘못되었습니다",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        # JWT 토큰 생성
        access_token = auth_service.create_access_token({
            "sub": user.site_id,
            "user_id": user.id,
            "is_admin": user.is_admin
        })
        
        # 마지막 로그인 시간 업데이트
        user.last_login = datetime.utcnow()
        db.commit()
        
        # 응답 데이터 생성
        user_response = UserResponse(
            id=user.id,
            site_id=user.site_id,
            nickname=user.nickname,
            phone_number=user.phone_number,
            cyber_token_balance=user.cyber_token_balance,
            created_at=user.created_at,
            last_login=user.last_login,
            is_admin=user.is_admin,
            is_active=user.is_active
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"로그인 오류: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="로그인 처리 중 오류가 발생했습니다"
        )

@router.post("/admin/login", response_model=Token)
async def admin_login(
    form_data: AdminLogin,
    db: Session = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service)
):
    """관리자 로그인"""
    try:
        logger.info(f"관리자 로그인 시도: site_id={form_data.site_id}")
        
        # 관리자 인증
        user = auth_service.authenticate_admin(form_data.site_id, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="관리자 인증에 실패했습니다",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        # JWT 토큰 생성
        access_token = auth_service.create_access_token({
            "sub": user.site_id,
            "user_id": user.id,
            "is_admin": user.is_admin
        })
        
        # 마지막 로그인 시간 업데이트
        user.last_login = datetime.utcnow()
        db.commit()
        
        # 응답 데이터 생성
        user_response = UserResponse(
            id=user.id,
            site_id=user.site_id,
            nickname=user.nickname,
            phone_number=user.phone_number,
            cyber_token_balance=user.cyber_token_balance,
            created_at=user.created_at,
            last_login=user.last_login,
            is_admin=user.is_admin,
            is_active=user.is_active
        )
        
        logger.info(f"관리자 로그인 성공: user_id={user.id}")
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"관리자 로그인 오류: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="관리자 로그인 처리 중 오류가 발생했습니다"
        )

@router.post("/refresh", response_model=Token)
async def refresh_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service)
):
    """토큰 갱신"""
    logger.info("API: POST /api/auth/refresh - 토큰 갱신 요청")
    try:
        # 현재 토큰에서 사용자 정보 추출
        token_data = auth_service.verify_token(credentials.credentials)
        
        # 사용자 조회
        user = db.query(User).filter(User.id == token_data.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="사용자를 찾을 수 없습니다"
            )
        
        # 새 토큰 생성
        new_access_token = auth_service.create_access_token({
            "sub": user.site_id,
            "user_id": user.id,
            "is_admin": user.is_admin
        })
        
        # 사용자 응답 데이터 생성
        user_response = UserResponse(
            id=user.id,
            site_id=user.site_id,
            nickname=user.nickname,
            phone_number=user.phone_number,
            cyber_token_balance=user.cyber_token_balance,
            created_at=user.created_at,
            last_login=user.last_login or user.created_at,
            is_admin=user.is_admin,
            is_active=user.is_active
        )
        
        logger.info(f"토큰 갱신 성공: user_id={user.id}")
        
        return Token(
            access_token=new_access_token,
            token_type="bearer",
            user=user_response
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"토큰 갱신 오류: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="토큰 갱신 중 오류가 발생했습니다"
        )

@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
):
    """로그아웃"""
    logger.info("API: POST /api/auth/logout - 로그아웃 요청")
    try:
        # 토큰 검증만 수행 (실제로는 토큰 블랙리스트 등을 구현할 수 있음)
        token_data = auth_service.verify_token(credentials.credentials)
        logger.info(f"로그아웃 성공: user_id={token_data.user_id}")
        
        return {"message": "로그아웃되었습니다"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"로그아웃 오류: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="로그아웃 처리 중 오류가 발생했습니다"
        )
