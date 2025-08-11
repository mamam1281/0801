"""인증 관련 의존성 모듈"""
import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.orm import Session

from .database import get_db
from .services.auth_service import AuthService
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

security = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """현재 인증된 사용자 정보 반환"""
    try:
        if credentials is None or not credentials.scheme or credentials.scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
            )
        token = credentials.credentials
        token_data = AuthService.verify_token(token)
        user = db.query(User).filter(User.id == token_data.user_id).first()
        
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

# ===== Role/Tier based access helpers =====

_TIER_ORDER = {"STANDARD": 1, "PREMIUM": 2, "VIP": 3}

def _tier_meets(user_tier: str, required: str) -> bool:
    return _TIER_ORDER.get(str(user_tier).upper(), 0) >= _TIER_ORDER.get(str(required).upper(), 0)

def require_min_tier(required_tier: str):
    async def _dep(current_user: User = Depends(get_current_user)) -> User:
        user_tier = getattr(current_user, "user_rank", "STANDARD")
        if not _tier_meets(user_tier, required_tier):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires {required_tier} tier",
            )
        return current_user
    return _dep
