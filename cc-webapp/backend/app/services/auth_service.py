"""인증 관련 서비스"""
import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from ..models.auth_models import User
from ..schemas.auth import TokenData, UserCreate, UserLogin, AdminLogin


# 보안 설정
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "30"))

# 비밀번호 해싱
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer 토큰
security = HTTPBearer()


class AuthService:
    """인증 서비스 클래스"""
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """비밀번호 검증"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """비밀번호 해싱"""
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """액세스 토큰 생성"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> TokenData:
        """토큰 검증"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            site_id: str = payload.get("sub")
            user_id: int = payload.get("user_id")
            is_admin: bool = payload.get("is_admin", False)
            
            if site_id is None or user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="토큰이 유효하지 않습니다"
                )
            
            token_data = TokenData(site_id=site_id, user_id=user_id, is_admin=is_admin)
            return token_data
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="토큰이 유효하지 않습니다"
            )
    
    @staticmethod
    def authenticate_user(db: Session, site_id: str, password: str) -> Optional[User]:
        """사용자 인증"""
        user = db.query(User).filter(User.site_id == site_id).first()
        if not user or not AuthService.verify_password(password, user.hashed_password):
            return None
        return user
    
    @staticmethod
    def authenticate_admin(db: Session, site_id: str, password: str) -> Optional[User]:
        """관리자 인증"""
        user = db.query(User).filter(
            User.site_id == site_id,
            User.is_admin == True
        ).first()
        if not user or not AuthService.verify_password(password, user.hashed_password):
            return None
        return user
    
    @staticmethod
    def create_user(db: Session, user_create: UserCreate) -> User:
        """사용자 생성 - 회원가입 필수 입력사항"""
        # 초대코드 검증 (5858은 항상 허용)
        if user_create.invite_code != "5858":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="유효하지 않은 초대코드입니다"
            )
        
        # 사이트 아이디 중복 검사
        if db.query(User).filter(User.site_id == user_create.site_id).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 존재하는 사이트 아이디입니다"
            )
        
        # 닉네임 중복 검사
        if db.query(User).filter(User.nickname == user_create.nickname).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 존재하는 닉네임입니다"
            )
        
        # 전화번호 중복 검사
        if db.query(User).filter(User.phone_number == user_create.phone_number).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 등록된 전화번호입니다"
            )
        
        # 사용자 생성
        hashed_password = AuthService.get_password_hash(user_create.password)
        db_user = User(
            site_id=user_create.site_id,
            nickname=user_create.nickname,
            phone_number=user_create.phone_number,
            hashed_password=hashed_password,
            invite_code=user_create.invite_code,
            is_admin=False
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    
    @staticmethod
    def update_last_login(db: Session, user: User) -> None:
        """마지막 로그인 시간 업데이트"""
        user.last_login = datetime.utcnow()
        db.commit()
        db.refresh(user)
    
    @staticmethod
    def get_current_user(db: Session, credentials: HTTPAuthorizationCredentials) -> User:
        """현재 사용자 가져오기"""
        token_data = AuthService.verify_token(credentials.credentials)
        user = db.query(User).filter(User.id == token_data.user_id).first()
        
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="사용자를 찾을 수 없습니다"
            )
        
        return user
    
    @staticmethod
    def get_current_admin(db: Session, credentials: HTTPAuthorizationCredentials) -> User:
        """현재 관리자 가져오기"""
        user = AuthService.get_current_user(db, credentials)
        
        if not user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="관리자 권한이 필요합니다"
            )
        
        return user
