"""
Casino-Club F2P - Unified Authentication System
=============================================================================
✅ Invite code based simplified registration system
✅ JWT access/refresh token management (with blacklist)
✅ Session management and security (login attempt limits)
✅ Rank-based access control (VIP/PREMIUM/STANDARD)
✅ Redis-based token blacklist
✅ All auth-related features integrated

🔧 Features:
- 초대코드로 즉시 가입 → 모든 서비스 접근 가능
- 토큰 기반 인증 (액세스 토큰 + 리프레시 토큰)
- 세션 추적 및 관리
- 강제 로그아웃 및 토큰 무효화
- 로그인 시도 제한 (브루트포스 방지)
- 디바이스 핑거프린팅

🔄 Previous Files Archived:
- simple_auth.py → archive/simple_auth.py.bak
- advanced_jwt_handler.py → archive/advanced_jwt_handler.py.bak
- unified_auth.py → archive/unified_auth.py.bak
- token_blacklist.py → archive/token_blacklist.py.bak
"""

import hashlib
import secrets
import uuid
import os
import logging
import random
import string
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple

from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..database import get_db
from ..models import auth_models

logger = logging.getLogger("unified_auth")

# ===== 환경 설정 =====
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "casino-club-secret-key-2024")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))
MAX_LOGIN_ATTEMPTS = int(os.getenv("MAX_LOGIN_ATTEMPTS", "5"))
LOCKOUT_DURATION_MINUTES = int(os.getenv("LOCKOUT_DURATION_MINUTES", "15"))

# ===== 보안 설정 =====
security = HTTPBearer(auto_error=False)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """🎰 통합 인증 서비스 - 모든 auth 기능 포함"""
    
    # ===== 초대코드 기반 가입 기능 =====
    @staticmethod
    def generate_invite_code() -> str:
        """6자리 초대코드 생성"""
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    @staticmethod
    def register_with_invite_code(invite_code: str, nickname: str, db: Session):
        """초대코드로 즉시 가입 - 모든 서비스 접근 가능"""
        try:
            from ..models.auth_models import User, InviteCode
            
            # 초대코드 유효성 검사
            invite = db.query(InviteCode).filter(
                InviteCode.code == invite_code,
                InviteCode.is_used == False
            ).first()
            
            if not invite:
                raise HTTPException(status_code=400, detail="잘못된 초대코드입니다")
            
            # 닉네임 중복 검사
            existing_user = db.query(User).filter(User.nickname == nickname).first()
            if existing_user:
                raise HTTPException(status_code=400, detail="이미 사용중인 닉네임입니다")
            
            # 사용자 생성 - 즉시 모든 서비스 접근 가능
            user_timestamp = int(time.time())
            user = User(
                site_id=f"casino_user_{user_timestamp}",  # 고유한 site_id 생성
                nickname=nickname,
                phone_number=f"000-{user_timestamp % 10000:04d}-{user_timestamp % 10000:04d}",
                password_hash="no_password_required",  # 초대코드 기반이므로 비밀번호 불필요
                email=f"user_{user_timestamp}@casino-club.local",  # 기본 이메일
                vip_tier="STANDARD",  # 기본 랭크
                battlepass_level=1,  # 기본 배틀패스 레벨
                cyber_tokens=200,  # 초기 토큰
                created_at=datetime.utcnow()
            )
            
            # 초대코드 사용 처리
            invite.is_used = True
            invite.used_at = datetime.utcnow()
            invite.used_by_user_id = user.id
            
            db.add(user)
            db.commit()
            db.refresh(user)
            
            logger.info(f"New user registered with invite code: {nickname} (ID: {user.id})")
            return user
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to register with invite code: {str(e)}")
            raise HTTPException(status_code=500, detail="가입 처리 중 오류가 발생했습니다")
    
    @staticmethod
    def login_with_invite_code(invite_code: str, nickname: str, ip_address: str, user_agent: str, db: Session):
        """초대코드 + 닉네임으로 로그인 (가입이 안되어 있으면 자동 가입)"""
        try:
            from ..models.auth_models import User, InviteCode
            
            # 먼저 기존 사용자 확인
            user = db.query(User).filter(User.nickname == nickname).first()
            
            if user:
                # 기존 사용자면 바로 로그인
                logger.info(f"Existing user login: {nickname}")
            else:
                # 신규 사용자면 자동 가입
                user = AuthService.register_with_invite_code(invite_code, nickname, db)
                logger.info(f"Auto-registered new user: {nickname}")
            
            # 세션 생성
            session_id = AuthService.create_user_session(user.id, ip_address, user_agent, db)
            
            # 액세스 토큰 생성
            access_token = AuthService.create_access_token(user.id, session_id)
            
            # 리프레시 토큰 생성 및 저장
            refresh_token = AuthService.create_refresh_token()
            AuthService.save_refresh_token(user.id, refresh_token, ip_address, user_agent, db)
            
            # 로그인 성공 기록
            AuthService.record_login_attempt(
                site_id=user.site_id,
                ip_address=ip_address,
                user_agent=user_agent,
                success=True,
                user_id=user.id,
                db=db
            )
            
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "expires_in": JWT_EXPIRE_MINUTES * 60,
                "user": {
                    "id": user.id,
                    "nickname": user.nickname,
                    "vip_tier": user.vip_tier,
                    "cyber_tokens": user.cyber_tokens,
                    "battlepass_level": user.battlepass_level
                }
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Login failed for {nickname}: {str(e)}")
            raise HTTPException(status_code=500, detail="로그인 처리 중 오류가 발생했습니다")
    
    # ===== 랭크 기반 접근 제어 =====
    @staticmethod
    def check_rank_access(user_rank: str, required_rank: str) -> bool:
        """랭크 기반 접근 제어"""
        rank_hierarchy = {
            "VIP": 3,
            "PREMIUM": 2, 
            "STANDARD": 1
        }
        
        user_level = rank_hierarchy.get(user_rank, 1)
        required_level = rank_hierarchy.get(required_rank, 1)
        
        return user_level >= required_level
    
    @staticmethod
    def check_combined_access(user_rank: str, user_segment_level: int, 
                            required_rank: str, required_segment_level: int) -> bool:
        """랭크 + RFM 세그먼트 조합 접근 제어"""
        rank_ok = AuthService.check_rank_access(user_rank, required_rank)
        segment_ok = user_segment_level >= required_segment_level
        
        return rank_ok and segment_ok
    
    # ===== 비밀번호 및 토큰 관리 =====
    @staticmethod
    def hash_password(password: str) -> str:
        """비밀번호 해싱"""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """비밀번호 검증"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def create_access_token(user_id: int, session_id: str = None) -> str:
        """액세스 토큰 생성"""
        now = datetime.utcnow()
        expire = now + timedelta(minutes=JWT_EXPIRE_MINUTES)
        
        payload = {
            "sub": str(user_id),
            "session_id": session_id or str(uuid.uuid4()),
            "jti": str(uuid.uuid4()),  # JWT ID 추가 (블랙리스트용)
            "iat": now.timestamp(),
            "exp": expire.timestamp(),
            "type": "access"
        }
        
        return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    
    @staticmethod
    def create_refresh_token() -> str:
        """리프레시 토큰 생성"""
        return secrets.token_urlsafe(64)
    
    @staticmethod
    def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
        """액세스 토큰 검증 (블랙리스트 확인 포함)"""
        try:
            # 먼저 블랙리스트 확인
            if AuthService.is_token_blacklisted(token):
                logger.warning("Access denied: token is blacklisted")
                return None
            
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            
            if payload.get("type") != "access":
                return None
                
            return payload
            
        except JWTError as e:
            logger.warning(f"JWT verification failed: {str(e)}")
            return None
    
    @staticmethod
    def refresh_access_token(refresh_token: str, ip_address: str, user_agent: str, db: Session):
        """리프레시 토큰으로 새 액세스 토큰 발급"""
        try:
            from ..models.auth_models import RefreshToken, User
            
            # 리프레시 토큰 해시 계산
            token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
            
            # 데이터베이스에서 리프레시 토큰 검증
            refresh_record = db.query(RefreshToken).filter(
                and_(
                    RefreshToken.token_hash == token_hash,
                    RefreshToken.is_active == True,
                    RefreshToken.expires_at > datetime.utcnow()
                )
            ).first()
            
            if not refresh_record:
                logger.warning(f"Invalid refresh token attempt from {ip_address}")
                raise HTTPException(status_code=401, detail="유효하지 않은 리프레시 토큰입니다")
            
            # 디바이스 핑거프린트 검증 (선택적)
            device_fingerprint = hashlib.sha256(f"{user_agent}:{ip_address}".encode()).hexdigest()
            if refresh_record.device_fingerprint != device_fingerprint:
                logger.warning(f"Device fingerprint mismatch for user {refresh_record.user_id}")
                # 엄격한 보안이 필요하다면 여기서 에러 발생
                # raise HTTPException(status_code=401, detail="디바이스 정보가 일치하지 않습니다")
            
            # 사용자 정보 가져오기
            user = db.query(User).filter(User.id == refresh_record.user_id).first()
            if not user:
                raise HTTPException(status_code=401, detail="사용자를 찾을 수 없습니다")
            
            # 새 세션 생성
            session_id = AuthService.create_user_session(user.id, ip_address, user_agent, db)
            
            # 새 액세스 토큰 생성
            new_access_token = AuthService.create_access_token(user.id, session_id)
            
            logger.info(f"Access token refreshed for user {user.id}")
            
            return {
                "access_token": new_access_token,
                "token_type": "bearer",
                "expires_in": JWT_EXPIRE_MINUTES * 60
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Token refresh failed: {str(e)}")
            raise HTTPException(status_code=500, detail="토큰 갱신 중 오류가 발생했습니다")
    
    # ===== 로그인 시도 제한 =====
    @staticmethod
    def check_login_attempts(site_id: str, ip_address: str, db: Session) -> Tuple[bool, int]:
        """로그인 시도 횟수 확인"""
        try:
            from ..models.auth_models import LoginAttempt
            
            cutoff_time = datetime.utcnow() - timedelta(minutes=LOCKOUT_DURATION_MINUTES)
            
            failed_attempts = db.query(LoginAttempt).filter(
                and_(
                    LoginAttempt.site_id == site_id,
                    LoginAttempt.ip_address == ip_address,
                    LoginAttempt.success == False,
                    LoginAttempt.attempted_at > cutoff_time
                )
            ).count()
            
            is_allowed = failed_attempts < MAX_LOGIN_ATTEMPTS
            remaining_attempts = max(0, MAX_LOGIN_ATTEMPTS - failed_attempts)
            
            return is_allowed, remaining_attempts
            
        except Exception as e:
            logger.error(f"Failed to check login attempts: {str(e)}")
            return True, MAX_LOGIN_ATTEMPTS
    
    @staticmethod
    def record_login_attempt(
        site_id: str,
        ip_address: str,
        user_agent: str,
        success: bool,
        user_id: Optional[int] = None,
        failure_reason: Optional[str] = None,
        db: Session = None
    ):
        """로그인 시도 기록"""
        try:
            from ..models.auth_models import LoginAttempt
            
            attempt = LoginAttempt(
                site_id=site_id,
                user_id=user_id,
                ip_address=ip_address,
                user_agent=user_agent,
                success=success,
                failure_reason=failure_reason,
                attempted_at=datetime.utcnow()
            )
            
            db.add(attempt)
            db.commit()
            
            if not success:
                logger.warning(f"Failed login attempt for {site_id} from {ip_address}: {failure_reason}")
            else:
                logger.info(f"Successful login for {site_id} from {ip_address}")
                
        except Exception as e:
            logger.error(f"Failed to record login attempt: {str(e)}")
    
    # ===== 세션 관리 =====
    @staticmethod
    def create_user_session(
        user_id: int,
        ip_address: str,
        user_agent: str,
        db: Session
    ) -> str:
        """사용자 세션 생성"""
        try:
            from ..models.auth_models import UserSession
            
            session_id = str(uuid.uuid4())
            device_fingerprint = hashlib.sha256(
                f"{user_agent}:{ip_address}:{secrets.token_hex(8)}".encode()
            ).hexdigest()
            
            expires_at = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
            
            session = UserSession(
                user_id=user_id,
                session_id=session_id,
                device_fingerprint=device_fingerprint,
                ip_address=ip_address,
                user_agent=user_agent,
                expires_at=expires_at,
                is_active=True,
                created_at=datetime.utcnow()
            )
            
            db.add(session)
            db.commit()
            
            logger.info(f"Session created for user {user_id}: {session_id}")
            return session_id
            
        except Exception as e:
            logger.error(f"Failed to create session: {str(e)}")
            return str(uuid.uuid4())  # fallback
    
    @staticmethod
    def save_refresh_token(
        user_id: int,
        refresh_token: str,
        ip_address: str,
        user_agent: str,
        db: Session
    ):
        """리프레시 토큰 저장"""
        try:
            from ..models.auth_models import RefreshToken
            
            token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
            device_fingerprint = hashlib.sha256(
                f"{user_agent}:{ip_address}".encode()
            ).hexdigest()
            
            expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
            
            refresh_token_record = RefreshToken(
                user_id=user_id,
                token_hash=token_hash,
                device_fingerprint=device_fingerprint,
                ip_address=ip_address,
                user_agent=user_agent,
                expires_at=expires_at,
                is_active=True,
                created_at=datetime.utcnow()
            )
            
            db.add(refresh_token_record)
            db.commit()
            
            logger.info(f"Refresh token saved for user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to save refresh token: {str(e)}")
    
    @staticmethod
    def logout_user_session(
        user_id: int,
        session_id: Optional[str] = None,
        reason: str = "user_logout",
        db: Session = None
    ):
        """사용자 세션 로그아웃"""
        try:
            from ..models.auth_models import UserSession
            
            query = db.query(UserSession).filter(
                UserSession.user_id == user_id,
                UserSession.is_active == True
            )
            
            if session_id:
                query = query.filter(UserSession.session_id == session_id)
            
            sessions = query.all()
            
            for session in sessions:
                session.is_active = False
                session.logout_at = datetime.utcnow()
                session.logout_reason = reason
            
            db.commit()
            
            count = len(sessions)
            logger.info(f"Logged out {count} sessions for user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to logout sessions: {str(e)}")
    
    @staticmethod
    def logout_all_user_sessions(
        user_id: int,
        reason: str = "user_logout_all",
        db: Session = None
    ):
        """사용자의 모든 세션 로그아웃"""
        try:
            from ..models.auth_models import UserSession, RefreshToken
            
            # 모든 세션 비활성화
            sessions = db.query(UserSession).filter(
                UserSession.user_id == user_id,
                UserSession.is_active == True
            ).all()
            
            for session in sessions:
                session.is_active = False
                session.logout_at = datetime.utcnow()
                session.logout_reason = reason
            
            # 모든 리프레시 토큰 비활성화
            refresh_tokens = db.query(RefreshToken).filter(
                RefreshToken.user_id == user_id,
                RefreshToken.is_active == True
            ).all()
            
            for token in refresh_tokens:
                token.is_active = False
                token.revoked_at = datetime.utcnow()
                token.revoke_reason = reason
            
            db.commit()
            
            logger.info(f"Logged out all {len(sessions)} sessions and {len(refresh_tokens)} refresh tokens for user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to logout all sessions: {str(e)}")
    
    # ===== 토큰 블랙리스트 관리 =====
    @staticmethod
    def blacklist_token(token: str, reason: str = "logout") -> bool:
        """토큰을 블랙리스트에 추가"""
        try:
            # JWT 토큰에서 jti (JWT ID) 추출
            try:
                payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
                jti = payload.get("jti")
                exp = payload.get("exp")
                
                if not jti:
                    logger.warning("Token has no JTI, cannot blacklist")
                    return False
                    
            except JWTError as e:
                logger.warning(f"Cannot decode token for blacklisting: {e}")
                return False
            
            # Redis에 블랙리스트 저장 (만료 시간까지)
            try:
                import redis
                redis_client = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)
                
                # 토큰 만료까지 블랙리스트에 보관
                expire_time = datetime.fromtimestamp(exp) - datetime.utcnow()
                if expire_time.total_seconds() > 0:
                    redis_client.setex(
                        f"blacklist_token:{jti}",
                        int(expire_time.total_seconds()),
                        reason
                    )
                    logger.info(f"Token {jti} blacklisted for {reason}")
                    return True
                else:
                    logger.info(f"Token {jti} already expired, no need to blacklist")
                    return True
                    
            except Exception as redis_error:
                logger.warning(f"Redis not available, using memory fallback: {redis_error}")
                # Redis 없을 시 메모리 기반 fallback (재시작 시 초기화됨)
                if not hasattr(AuthService, '_memory_blacklist'):
                    AuthService._memory_blacklist = {}
                AuthService._memory_blacklist[jti] = {
                    'reason': reason,
                    'expires_at': exp
                }
                return True
                
        except Exception as e:
            logger.error(f"Failed to blacklist token: {e}")
            return False
    
    @staticmethod
    def is_token_blacklisted(token: str) -> bool:
        """토큰이 블랙리스트에 있는지 확인"""
        try:
            # JWT 토큰에서 jti 추출
            try:
                payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
                jti = payload.get("jti")
                
                if not jti:
                    return False
                    
            except JWTError:
                return True  # 유효하지 않은 토큰은 차단
            
            # Redis에서 확인
            try:
                import redis
                redis_client = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)
                
                blacklisted = redis_client.exists(f"blacklist_token:{jti}")
                if blacklisted:
                    logger.info(f"Token {jti} is blacklisted")
                    return True
                    
            except Exception as redis_error:
                logger.warning(f"Redis not available, checking memory fallback: {redis_error}")
                # 메모리 기반 fallback 확인
                if hasattr(AuthService, '_memory_blacklist'):
                    if jti in AuthService._memory_blacklist:
                        # 만료 시간 확인
                        exp = AuthService._memory_blacklist[jti]['expires_at']
                        if datetime.utcnow().timestamp() < exp:
                            return True
                        else:
                            # 만료된 토큰은 블랙리스트에서 제거
                            del AuthService._memory_blacklist[jti]
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to check token blacklist: {e}")
            return False  # 오류 시 허용 (보안보다 가용성 우선)
    
    # ===== 사용자 인증 및 권한 확인 =====
    @staticmethod
    def get_current_user(token: str, db: Session):
        """현재 사용자 정보 가져오기 (토큰 기반)"""
        try:
            from ..models.auth_models import User
            
            # 토큰 검증
            payload = AuthService.verify_access_token(token)
            if not payload:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="유효하지 않은 토큰입니다",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            user_id = int(payload.get("sub"))
            user = db.query(User).filter(User.id == user_id).first()
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="사용자를 찾을 수 없습니다",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            return user
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get current user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="인증 처리 중 오류가 발생했습니다",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    @staticmethod
    def get_current_user_dependency(
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: Session = Depends(get_db)
    ):
        """FastAPI 의존성 주입용 현재 사용자 가져오기"""
        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="인증 토큰이 필요합니다",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return AuthService.get_current_user(credentials.credentials, db)


# ===== 전역 인스턴스 및 헬퍼 함수 =====
auth_service = AuthService()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """현재 사용자 정보 가져오기 (의존성 주입용)"""
    return auth_service.get_current_user_dependency(credentials, db)

def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
):
    """현재 사용자 정보 가져오기 (선택적, 토큰 없어도 None 반환)"""
    if not credentials:
        return None
    
    try:
        return auth_service.get_current_user(credentials.credentials, db)
    except HTTPException:
        return None
