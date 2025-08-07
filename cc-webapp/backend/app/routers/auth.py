"""통합된 인증 API 라우터"""
import logging
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt
from ..database import get_db
from ..schemas.auth import UserCreate, UserLogin, AdminLogin, UserResponse, Token
from ..models.auth_models import User, InviteCode, SecurityEvent
from ..config import settings
from ..dependencies import get_current_user

# 로깅 설정
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# 콘솔 로그 핸들러 설정
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

# 비밀번호 해싱
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP 보안 스키마
security = HTTPBearer()

# 인증 서비스 클래스
class AuthService:
    def create_access_token(self, data: dict, expires_delta: timedelta = None):
        """JWT 액세스 토큰 생성"""
        to_encode = data.copy()
        expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.jwt_expire_minutes))
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
        return encoded_jwt

# 인증 서비스 인스턴스
auth_service = AuthService()

# Logger setup
logger = logging.getLogger(__name__)

# Auth service instance
auth_service = AuthService()

# OAuth2 schema
oauth2_scheme = HTTPBearer()

# Configuration values
JWT_EXPIRE_MINUTES = settings.jwt_expire_minutes
INITIAL_CYBER_TOKENS = getattr(settings, 'initial_cyber_tokens', 200)

# 라우터 설정 - prefix 및 태그 통일
router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/signup", response_model=Token)
async def signup(
    data: UserCreate,
    db = Depends(get_db)
):
    """User registration (site_id(=user_id), nickname, password (min 4 chars), using fixed invite code '5858')"""
    try:
        logger.info(f"Registration attempt: site_id={data.site_id}, nickname={data.nickname}")
        
        # 비밀번호 검증 (4글자 이상)
        if len(data.password) < 4:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="비밀번호는 4글자 이상이어야 합니다"
            )
        
        # Create user through AuthService
        user = auth_service.create_user(db, data)
        
        # Generate token - 수정: 딕셔너리로 전달
        access_token = auth_service.create_access_token({
            "sub": user.site_id,
            "user_id": user.id,
            "is_admin": user.is_admin
        })
        
        # Create user response data
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
        
        logger.info(f"Registration successful: user_id={user.id}")
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail="Registration processing error occurred")

# 로그인 라우터 수정 - 올바른 응답 포맷으로 변경
@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """사용자 로그인"""
    try:
        # 사용자 인증
        user = auth_service.authenticate_user(db, form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="아이디 또는 비밀번호가 잘못되었습니다",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        # JWT 토큰 생성 - 수정: 딕셔너리로 전달
        access_token = auth_service.create_access_token({
            "sub": user.site_id,
            "user_id": user.id,
            "is_admin": user.is_admin
        })
        
        # 마지막 로그인 시간 업데이트
        user.last_login = datetime.utcnow()
        db.commit()
        
        # Create user response
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
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login processing error occurred"
        )

@router.post("/admin/login", response_model=Token)
async def admin_login(
    form_data: AdminLogin,
    db = Depends(get_db)
):
    """Admin login"""
    try:
        logger.info(f"Admin login attempt: site_id={form_data.site_id}")
        
        # Admin authentication through AuthService
        user = auth_service.authenticate_admin(db, form_data.site_id, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid admin credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        # Generate access token - 수정: 딕셔너리로 전달
        access_token = auth_service.create_access_token({
            "sub": user.site_id,
            "user_id": user.id,
            "is_admin": user.is_admin
        })
        
        # Update last login time
        user.last_login = datetime.utcnow()
        db.commit()
        
        # Create user response
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
        
        logger.info(f"Admin login successful: user_id={user.id}")
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin login error: {e}")
        raise HTTPException(status_code=500, detail="Admin login processing error occurred")

@router.post("/refresh", response_model=Token)
async def refresh_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
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
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(status_code=500, detail="Token refresh error occurred")

@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
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
        logger.error(f"Logout error: {e}")
        raise HTTPException(status_code=500, detail="Logout error occurred")
