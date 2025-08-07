"""단순화된 의존성 모듈"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from .models.simple_auth_models import User
from .database import get_db
from .config_simple import settings
import logging

# 로깅 설정
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# 콘솔 로그 핸들러 설정
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

# OAuth2 설정
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """현재 인증된 사용자 가져오기 - 단순화된 버전"""
    logger.debug(f"[AUTH] Token received (first 10 chars): {token[:10]}...")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보를 확인할 수 없습니다",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # 토큰 디코딩
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("user_id")
        
        if user_id is None:
            logger.error("[AUTH] user_id not found in token")
            raise credentials_exception
            
        logger.debug(f"[AUTH] User ID from token: {user_id}")
        
    except JWTError as e:
        logger.error(f"[AUTH] JWT Error: {str(e)}")
        raise credentials_exception
        
    # 데이터베이스에서 사용자 조회
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        logger.error(f"[AUTH] User not found with ID: {user_id}")
        raise credentials_exception
        
    logger.debug(f"[AUTH] User authenticated: {user.nickname}")
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """현재 활성 사용자 가져오기"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="비활성화된 사용자입니다")
    return current_user

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """현재 관리자 사용자 가져오기"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다")
    return current_user
