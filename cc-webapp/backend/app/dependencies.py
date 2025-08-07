"""인증 관련 의존성 모듈"""
import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.orm import Session

from .database import get_db
from .auth.auth_service import AuthService
from .models.auth_models import User

# 로깅 설정
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# 콘솔 로그 핸들러 설정
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

security = HTTPBearer()

def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    """AuthService 인스턴스를 반환"""
    return AuthService(db)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> User:
    """현재 인증된 사용자 정보 반환"""
    try:
        token = credentials.credentials
        payload = auth_service.verify_token(token)
        
        user_id = int(payload["sub"])
        user = auth_service.db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
            
        return user
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}"
        )

async def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """현재 인증된 관리자 정보 반환"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user
    user = get_current_user(token, db)
    # Safe check for admin attribute
    is_admin = getattr(user, 'is_admin', False)
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized as admin",
        )
    return user
