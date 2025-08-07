"""
Simplified Authentication Router
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import jwt

from ...database import get_db
from ...models.simple_auth_models import User, InviteCode
from ...schemas.simple_auth import UserCreate, UserLogin, Token
from . import router  # 이미 정의된 router를 임포트

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/verify-invite")
async def verify_invite_code(invite_code: str, db: Session = Depends(get_db)):
    """초대 코드 확인"""
    # 개발 환경에서는 5858을 항상 유효한 코드로 처리
    if invite_code == "5858":
        return {"valid": True, "message": "Valid invite code"}
    
    # DB에서 초대 코드 확인
    code = db.query(InviteCode).filter(
        InviteCode.code == invite_code,
        InviteCode.is_active == True
    ).first()
    
    if code:
        return {"valid": True, "message": "Valid invite code"}
    return {"valid": False, "message": "Invalid invite code"}

@router.post("/signup", response_model=Token)
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """회원가입"""
    # 초대 코드 확인
    if user_data.invite_code != "5858":
        code = db.query(InviteCode).filter(
            InviteCode.code == user_data.invite_code,
            InviteCode.is_active == True
        ).first()
        if not code:
            raise HTTPException(
                status_code=400,
                detail="Invalid invite code"
            )
    
    # 중복 확인
    if db.query(User).filter(User.site_id == user_data.site_id).first():
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )
    
    if db.query(User).filter(User.nickname == user_data.nickname).first():
        raise HTTPException(
            status_code=400,
            detail="Nickname already taken"
        )
    
    if db.query(User).filter(User.phone_number == user_data.phone_number).first():
        raise HTTPException(
            status_code=400,
            detail="Phone number already registered"
        )
    
    # 비밀번호 길이 확인
    if len(user_data.password) < 4:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 4 characters"
        )
    
    # 사용자 생성
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        site_id=user_data.site_id,
        nickname=user_data.nickname,
        phone_number=user_data.phone_number,
        password_hash=hashed_password,
        invite_code=user_data.invite_code
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # JWT 토큰 생성
    access_token = create_access_token(
        data={"sub": db_user.site_id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "site_id": db_user.site_id,
            "nickname": db_user.nickname
        }
    }

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """로그인"""
    user = db.query(User).filter(User.site_id == user_data.username).first()
    
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        )
    
    # JWT 토큰 생성
    access_token = create_access_token(
        data={"sub": user.site_id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    # 마지막 로그인 시간 업데이트
    user.last_login = datetime.utcnow()
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "site_id": user.site_id,
            "nickname": user.nickname
        }
    }