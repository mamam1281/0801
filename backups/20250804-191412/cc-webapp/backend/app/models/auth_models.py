"""인증 관련 데이터베이스 모델"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base

class User(Base):
    """사용자 모델"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(String(50), unique=True, index=True, nullable=False)  # 사이트 아이디
    nickname = Column(String(50), unique=True, nullable=False)  # 닉네임 (필수, 중복불가)
    phone_number = Column(String(20), unique=True, nullable=False)  # 전화번호 (필수, 중복불가)
    hashed_password = Column(String(255), nullable=False)  # 비밀번호
    invite_code = Column(String(10), nullable=False)  # 초대코드 (5858)
    cyber_token_balance = Column(Integer, default=200)  # 사이버 토큰 잔액
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)  # 관리자 여부
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # 프로필 관련
    avatar_url = Column(String(255))
    bio = Column(Text)
    
    # 기존 관계 (존재한다면)
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    security_events = relationship("SecurityEvent", back_populates="user", cascade="all, delete-orphan")

    # 게임 및 활동 관련 관계 추가
    actions = relationship("UserAction", back_populates="user", cascade="all, delete-orphan")
    rewards = relationship("UserReward", back_populates="user", cascade="all, delete-orphan")
    game_sessions = relationship("GameSession", back_populates="user", cascade="all, delete-orphan")
    activities = relationship("UserActivity", back_populates="user", cascade="all, delete-orphan")
    gacha_results = relationship("GachaResult", back_populates="user", cascade="all, delete-orphan")
    progress = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")

    # 세그먼트 관계 추가
    segment = relationship("UserSegment", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    # 알림 관계 추가
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class InviteCode(Base):
    """초대코드 모델"""
    __tablename__ = "invite_codes"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, index=True, nullable=False)
    is_used = Column(Boolean, default=False)
    used_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    used_at = Column(DateTime, nullable=True)
    
    # 관계
    used_by = relationship("User", foreign_keys=[used_by_user_id])

class LoginAttempt(Base):
    """로그인 시도 기록"""
    __tablename__ = "login_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(String(50), nullable=False)
    success = Column(Boolean, nullable=False)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    failure_reason = Column(String(100))

class RefreshToken(Base):
    """리프레시 토큰 모델"""
    __tablename__ = "refresh_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_revoked = Column(Boolean, default=False)
    
    # 관계
    user = relationship("User", foreign_keys=[user_id])

class UserSession(Base):
    """사용자 세션 모델"""
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_token = Column(String(255), unique=True, index=True, nullable=False)
    refresh_token = Column(String(255), unique=True, index=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    user_agent = Column(Text)
    ip_address = Column(String(45))
    
    # 관계
    user = relationship("User", back_populates="sessions")

class SecurityEvent(Base):
    """보안 이벤트 모델"""
    __tablename__ = "security_events"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_type = Column(String(50), nullable=False)
    event_data = Column(Text)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_suspicious = Column(Boolean, default=False)
    
    # 관계
    user = relationship("User", back_populates="security_events")
