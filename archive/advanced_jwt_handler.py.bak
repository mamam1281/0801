"""
고급 JWT 인증 핸들러
- 액세스 토큰 + 리프레시 토큰 관리
- 로그인 시도 제한
- 세션 관리
- 토큰 블랙리스트 연동
- 강제 로그아웃
"""

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
import logging
import json

from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from ..models import User
from ..models.auth_models import LoginAttempt, RefreshToken, UserSession, SecurityEvent
from .token_blacklist import get_token_blacklist
from ..config import Settings
import os

logger = logging.getLogger("advanced_jwt")

# 설정 값들을 환경변수에서 직접 읽기
class AuthSettings:
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "changeme")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))
    REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))
    MAX_LOGIN_ATTEMPTS = int(os.getenv("MAX_LOGIN_ATTEMPTS", "5"))
    LOCKOUT_DURATION_MINUTES = int(os.getenv("LOCKOUT_DURATION_MINUTES", "15"))
    MAX_SESSIONS_PER_USER = int(os.getenv("MAX_SESSIONS_PER_USER", "5"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AdvancedJWTHandler:
    """고급 JWT 인증 처리기"""
    
    def __init__(self):
        self.blacklist = get_token_blacklist()
        self.secret_key = AuthSettings.JWT_SECRET_KEY
        self.algorithm = AuthSettings.JWT_ALGORITHM
        self.access_token_expire_minutes = AuthSettings.JWT_EXPIRE_MINUTES
        self.refresh_token_expire_days = AuthSettings.REFRESH_TOKEN_EXPIRE_DAYS
        self.max_login_attempts = AuthSettings.MAX_LOGIN_ATTEMPTS
        self.lockout_duration_minutes = AuthSettings.LOCKOUT_DURATION_MINUTES
        self.max_sessions_per_user = AuthSettings.MAX_SESSIONS_PER_USER
    
    def hash_password(self, password: str) -> str:
        """비밀번호 해싱"""
        return pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """비밀번호 검증"""
        return pwd_context.verify(plain_password, hashed_password)
    
    def _hash_token(self, token: str) -> str:
        """토큰 해싱 (저장용)"""
        return hashlib.sha256(token.encode()).hexdigest()
    
    def _generate_device_fingerprint(self, user_agent: str, ip_address: str) -> str:
        """디바이스 핑거프린트 생성"""
        data = f"{user_agent}:{ip_address}:{secrets.token_hex(8)}"
        return hashlib.sha256(data.encode()).hexdigest()
    
    def check_login_attempts(self, site_id: str, ip_address: str, db: Session) -> Tuple[bool, int]:
        """
        로그인 시도 횟수 확인
        
        Returns:
            (is_allowed, remaining_attempts)
        """
        cutoff_time = datetime.utcnow() - timedelta(minutes=self.lockout_duration_minutes)
        
        # 최근 실패한 로그인 시도 횟수 확인
        failed_attempts = db.query(LoginAttempt).filter(
            and_(
                LoginAttempt.site_id == site_id,
                LoginAttempt.ip_address == ip_address,
                LoginAttempt.success == False,
                LoginAttempt.attempted_at > cutoff_time
            )
        ).count()
        
        is_allowed = failed_attempts < self.max_login_attempts
        remaining_attempts = max(0, self.max_login_attempts - failed_attempts)
        
        if not is_allowed:
            # 보안 이벤트 로깅
            self._log_security_event(
                None, "account_locked", "CRITICAL",
                f"Account locked due to {failed_attempts} failed login attempts",
                ip_address, "", db
            )
        
        return is_allowed, remaining_attempts
    
    def record_login_attempt(
        self,
        site_id: str,
        ip_address: str,
        user_agent: str,
        success: bool,
        failure_reason: Optional[str] = None,
        db: Session = None
    ):
        """로그인 시도 기록"""
        attempt = LoginAttempt(
            site_id=site_id,
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
    
    def create_access_token(
        self,
        user_id: int,
        session_id: str,
        extra_claims: Optional[Dict[str, Any]] = None
    ) -> str:
        """액세스 토큰 생성"""
        now = datetime.utcnow()
        expire = now + timedelta(minutes=self.access_token_expire_minutes)
        
        payload = {
            "sub": str(user_id),
            "session_id": session_id,
            "iat": now.timestamp(),
            "exp": expire.timestamp(),
            "type": "access"
        }
        
        if extra_claims:
            payload.update(extra_claims)
        
        token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
        logger.debug(f"Access token created for user {user_id}, session {session_id}")
        
        return token
    
    def create_refresh_token(
        self,
        user_id: int,
        ip_address: str,
        user_agent: str,
        db: Session
    ) -> str:
        """리프레시 토큰 생성 및 저장"""
        token = secrets.token_urlsafe(64)
        token_hash = self._hash_token(token)
        device_fingerprint = self._generate_device_fingerprint(user_agent, ip_address)
        
        expires_at = datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
        
        refresh_token = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            device_fingerprint=device_fingerprint,
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=expires_at
        )
        
        db.add(refresh_token)
        db.commit()
        db.refresh(refresh_token)
        
        logger.info(f"Refresh token created for user {user_id}")
        return token
    
    def create_session(
        self,
        user_id: int,
        ip_address: str,
        user_agent: str,
        db: Session
    ) -> str:
        """사용자 세션 생성"""
        session_id = str(uuid.uuid4())
        device_fingerprint = self._generate_device_fingerprint(user_agent, ip_address)
        
        # 기존 세션 수 확인 및 정리
        self._cleanup_old_sessions(user_id, db)
        
        expires_at = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        session = UserSession(
            user_id=user_id,
            session_id=session_id,
            device_fingerprint=device_fingerprint,
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=expires_at
        )
        
        db.add(session)
        db.commit()
        
        logger.info(f"Session created for user {user_id}: {session_id}")
        return session_id
    
    def _cleanup_old_sessions(self, user_id: int, db: Session):
        """오래된 세션 정리"""
        # 만료된 세션 비활성화
        expired_sessions = db.query(UserSession).filter(
            and_(
                UserSession.user_id == user_id,
                UserSession.is_active == True,
                UserSession.expires_at < datetime.utcnow()
            )
        )
        
        for session in expired_sessions:
            session.is_active = False
            session.logout_at = datetime.utcnow()
            session.logout_reason = "timeout"
        
        # 최대 세션 수 초과시 오래된 세션 제거
        active_sessions = db.query(UserSession).filter(
            and_(
                UserSession.user_id == user_id,
                UserSession.is_active == True
            )
        ).order_by(UserSession.last_activity_at.desc()).all()
        
        if len(active_sessions) >= self.max_sessions_per_user:
            sessions_to_remove = active_sessions[self.max_sessions_per_user-1:]
            for session in sessions_to_remove:
                session.is_active = False
                session.logout_at = datetime.utcnow()
                session.logout_reason = "max_sessions_exceeded"
        
        db.commit()
    
    def verify_access_token(self, token: str, db: Session) -> Optional[Dict[str, Any]]:
        """액세스 토큰 검증"""
        try:
            # 블랙리스트 확인
            if self.blacklist.is_blacklisted(token):
                logger.warning("Token is blacklisted")
                return None
            
            # JWT 디코딩
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            
            # 토큰 타입 확인
            if payload.get("type") != "access":
                logger.warning("Invalid token type")
                return None
            
            # 세션 확인
            session_id = payload.get("session_id")
            if session_id:
                session = db.query(UserSession).filter(
                    and_(
                        UserSession.session_id == session_id,
                        UserSession.is_active == True,
                        UserSession.expires_at > datetime.utcnow()
                    )
                ).first()
                
                if not session:
                    logger.warning(f"Session not found or expired: {session_id}")
                    return None
                
                # 세션 활동 시간 업데이트
                session.last_activity_at = datetime.utcnow()
                db.commit()
            
            return payload
            
        except JWTError as e:
            logger.warning(f"JWT verification failed: {str(e)}")
            return None
    
    def refresh_access_token(
        self,
        refresh_token: str,
        ip_address: str,
        user_agent: str,
        db: Session
    ) -> Optional[Tuple[str, str]]:
        """리프레시 토큰으로 액세스 토큰 갱신"""
        token_hash = self._hash_token(refresh_token)
        
        # 리프레시 토큰 조회
        refresh_token_record = db.query(RefreshToken).filter(
            and_(
                RefreshToken.token_hash == token_hash,
                RefreshToken.is_revoked == False,
                RefreshToken.expires_at > datetime.utcnow()
            )
        ).first()
        
        if not refresh_token_record:
            logger.warning("Invalid or expired refresh token")
            return None
        
        # 사용 기록 업데이트
        refresh_token_record.last_used_at = datetime.utcnow()
        
        # 새 세션 생성
        session_id = self.create_session(
            refresh_token_record.user_id, ip_address, user_agent, db
        )
        
        # 새 액세스 토큰 생성
        access_token = self.create_access_token(
            refresh_token_record.user_id, session_id
        )
        
        db.commit()
        
        logger.info(f"Access token refreshed for user {refresh_token_record.user_id}")
        return access_token, session_id
    
    def logout_user(
        self,
        user_id: int,
        session_id: Optional[str] = None,
        revoke_all_sessions: bool = False,
        reason: str = "user_logout",
        db: Session = None
    ):
        """사용자 로그아웃"""
        if revoke_all_sessions:
            # 모든 세션 비활성화
            sessions = db.query(UserSession).filter(
                and_(
                    UserSession.user_id == user_id,
                    UserSession.is_active == True
                )
            ).all()
            
            for session in sessions:
                session.is_active = False
                session.logout_at = datetime.utcnow()
                session.logout_reason = reason
            
            # 모든 리프레시 토큰 무효화
            refresh_tokens = db.query(RefreshToken).filter(
                and_(
                    RefreshToken.user_id == user_id,
                    RefreshToken.is_revoked == False
                )
            ).all()
            
            for token in refresh_tokens:
                token.is_revoked = True
                token.revoked_at = datetime.utcnow()
                token.revoke_reason = reason
            
            logger.info(f"All sessions revoked for user {user_id}")
            
        elif session_id:
            # 특정 세션만 비활성화
            session = db.query(UserSession).filter(
                and_(
                    UserSession.user_id == user_id,
                    UserSession.session_id == session_id,
                    UserSession.is_active == True
                )
            ).first()
            
            if session:
                session.is_active = False
                session.logout_at = datetime.utcnow()
                session.logout_reason = reason
                
                logger.info(f"Session {session_id} logged out for user {user_id}")
        
        db.commit()
    
    def force_logout_user(self, user_id: int, reason: str, db: Session):
        """강제 로그아웃"""
        self.logout_user(user_id, revoke_all_sessions=True, reason=f"force_logout_{reason}", db=db)
        
        # 보안 이벤트 로깅
        self._log_security_event(
            user_id, "force_logout", "WARNING",
            f"User forcibly logged out: {reason}",
            "", "", db
        )
    
    def _log_security_event(
        self,
        user_id: Optional[int],
        event_type: str,
        severity: str,
        description: str,
        ip_address: str,
        user_agent: str,
        db: Session,
        metadata: Optional[Dict] = None
    ):
        """보안 이벤트 로깅"""
        event = SecurityEvent(
            user_id=user_id,
            event_type=event_type,
            severity=severity,
            description=description,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata=json.dumps(metadata) if metadata else None
        )
        
        db.add(event)
        db.commit()
        
        logger.info(f"Security event logged: {event_type} - {description}")
    
    def cleanup_expired_records(self, db: Session) -> Dict[str, int]:
        """만료된 기록들 정리"""
        now = datetime.utcnow()
        cleanup_counts = {}
        
        # 만료된 리프레시 토큰 정리
        expired_refresh_tokens = db.query(RefreshToken).filter(
            RefreshToken.expires_at < now
        ).count()
        
        db.query(RefreshToken).filter(
            RefreshToken.expires_at < now
        ).delete()
        
        cleanup_counts['refresh_tokens'] = expired_refresh_tokens
        
        # 만료된 세션 정리
        expired_sessions = db.query(UserSession).filter(
            and_(
                UserSession.expires_at < now,
                UserSession.is_active == True
            )
        ).count()
        
        db.query(UserSession).filter(
            and_(
                UserSession.expires_at < now,
                UserSession.is_active == True
            )
        ).update({
            UserSession.is_active: False,
            UserSession.logout_at: now,
            UserSession.logout_reason: "expired"
        })
        
        cleanup_counts['sessions'] = expired_sessions
        
        # 오래된 로그인 시도 기록 정리 (30일 이전)
        old_attempts = db.query(LoginAttempt).filter(
            LoginAttempt.attempted_at < now - timedelta(days=30)
        ).count()
        
        db.query(LoginAttempt).filter(
            LoginAttempt.attempted_at < now - timedelta(days=30)
        ).delete()
        
        cleanup_counts['login_attempts'] = old_attempts
        
        db.commit()
        
        logger.info(f"Cleanup completed: {cleanup_counts}")
        return cleanup_counts


# 전역 인스턴스
_jwt_handler = None

def get_jwt_handler() -> AdvancedJWTHandler:
    """JWT 핸들러 인스턴스 반환"""
    global _jwt_handler
    if _jwt_handler is None:
        _jwt_handler = AdvancedJWTHandler()
    return _jwt_handler
