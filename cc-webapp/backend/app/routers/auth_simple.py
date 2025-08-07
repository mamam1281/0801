"""단순화된 인증 라우터"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.simple_auth_models import User, InviteCode
from ..dependencies_simple import get_current_user
from ..config_simple import settings
from passlib.context import CryptContext
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

# 비밀번호 해싱
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"],
)

def create_access_token(data: dict, expires_delta: timedelta = None):
    """JWT 액세스 토큰 생성"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """로그인 엔드포인트"""
    logger.debug(f"[AUTH] Login attempt for username: {form_data.username}")
    
    # 사용자 확인
    user = db.query(User).filter(User.site_id == form_data.username).first()
    
    # 사용자가 없거나 비밀번호가 일치하지 않는 경우
    if not user or not pwd_context.verify(form_data.password, user.password_hash):
        logger.error(f"[AUTH] Login failed for username: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자 이름 또는 비밀번호가 올바르지 않습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 토큰 생성
    access_token_expires = timedelta(minutes=settings.jwt_access_token_expire_minutes)
    access_token = create_access_token(
        data={"user_id": user.id, "sub": user.site_id},
        expires_delta=access_token_expires,
    )
    
    logger.debug(f"[AUTH] Login successful for user: {user.nickname}")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "nickname": user.nickname,
    }

@router.post("/signup")
def signup(site_id: str, nickname: str, password: str, invite_code: str, db: Session = Depends(get_db)):
    """회원가입 엔드포인트"""
    logger.debug(f"[AUTH] Signup attempt for username: {site_id}")
    
    # 아이디 중복 확인
    existing_user = db.query(User).filter(User.site_id == site_id).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 사용중인 아이디입니다",
        )
    
    # 닉네임 중복 확인
    existing_nickname = db.query(User).filter(User.nickname == nickname).first()
    if existing_nickname:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 사용중인 닉네임입니다",
        )
    
    # 초대코드 확인
    invite = db.query(InviteCode).filter(InviteCode.code == invite_code, InviteCode.is_used == False).first()
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="유효하지 않은 초대코드입니다",
        )
    
    # 비밀번호 해싱
    hashed_password = pwd_context.hash(password)
    
    # 사용자 생성
    new_user = User(
        site_id=site_id,
        nickname=nickname,
        password_hash=hashed_password,
        is_active=True,
    )
    
    # 초대코드 사용 처리
    invite.is_used = True
    
    # 데이터베이스 저장
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    logger.debug(f"[AUTH] Signup successful for user: {new_user.nickname}")
    
    # 자동 로그인을 위한 토큰 생성
    access_token_expires = timedelta(minutes=settings.jwt_access_token_expire_minutes)
    access_token = create_access_token(
        data={"user_id": new_user.id, "sub": new_user.site_id},
        expires_delta=access_token_expires,
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": new_user.id,
        "nickname": new_user.nickname,
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """현재 로그인한 사용자 정보 조회"""
    return {
        "user_id": current_user.id,
        "site_id": current_user.site_id,
        "nickname": current_user.nickname,
        "is_admin": current_user.is_admin,
    }
