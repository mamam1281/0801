
# --- Unified Imports & Base ---
from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Boolean, Text, Index
from sqlalchemy.orm import relationship, declarative_base
# from sqlalchemy.dialects.postgresql import JSONB  # 임시 비활성화
from sqlalchemy.types import JSON
from datetime import datetime

Base = declarative_base()

# --- 관리자 계정/권한 관리 ---
class AdminUser(Base):
    __tablename__ = "admin_users"
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(128), nullable=False)
    role = Column(String(20), default="admin", nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    # Relationship
    setting_logs = relationship("SystemSettingLog", back_populates="admin", cascade="all, delete-orphan")

# --- 시스템 설정 변경 이력 (감사 로그) ---
class SystemSettingLog(Base):
    __tablename__ = "system_setting_logs"
    id = Column(Integer, primary_key=True)
    setting_key = Column(String(64), nullable=False, index=True)
    old_value = Column(String(256), nullable=True)
    new_value = Column(String(256), nullable=True)
    changed_by = Column(Integer, ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True, index=True)
    changed_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    admin = relationship("AdminUser", back_populates="setting_logs")
    __table_args__ = (Index("ix_setting_key_changed_at", "setting_key", "changed_at"),)
    # 관리 정책: 1년 이상 지난 로그는 별도 보관/삭제 (예시)
    '''
    # Log retention policy:
    # - Keep last 1 year in main table
    # - Archive/delete older logs periodically
    '''

# --- 시스템 이벤트/오류 로그 ---
class SystemLog(Base):
    __tablename__ = "system_logs"
    id = Column(Integer, primary_key=True)
    event_type = Column(String(50), nullable=False, index=True)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    user = relationship("User")
    __table_args__ = (Index("ix_event_type_created_at", "event_type", "created_at"),)
    # 관리 정책: 1년 이상 지난 로그는 별도 보관/삭제 (예시)
    '''
    # Log retention policy:
    # - Keep last 1 year in main table
    # - Archive/delete older logs periodically
    '''

# --- 시스템 설정 테이블 (관리자 기능용) ---
class SystemSetting(Base):
    __tablename__ = "system_settings"
    key = Column(String(64), primary_key=True, index=True)
    value = Column(String(256), nullable=False)
    value_type = Column(String(20), default="str", nullable=False, index=True)  # str, int, bool, float 등
    description = Column(String(255), nullable=True)
    is_admin_only = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    __table_args__ = (Index("ix_system_setting_key_type", "key", "value_type"),)

class Setting(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True)
    key = Column(String(64), unique=True, nullable=False, index=True)
    value = Column(String(256), nullable=True)
    description = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(String(50), unique=True, nullable=False, index=True)  # 로그인용 사이트ID 추가
    nickname = Column(String(50), unique=True, nullable=False)
    phone_number = Column(String(20), unique=True, nullable=False, index=True)  # 실제 전화번호
    password_hash = Column(String(100), nullable=False)  # 비밀번호 해시 추가
    invite_code = Column(String(6), nullable=False, index=True)  # 초대코드로 가입
    cyber_token_balance = Column(Integer, default=200)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)  # 최근 로그인 시간
    # 랭크 시스템 - VIP, PREMIUM, STANDARD 등
    rank = Column(String(20), default="STANDARD", nullable=False)

    actions = relationship("UserAction", back_populates="user")
    segment = relationship("UserSegment", uselist=False, back_populates="user") # One-to-one
    # rewards = relationship("UserReward", back_populates="user", primaryjoin="User.id == UserReward.user_id")  # 임시 비활성화
    site_visits = relationship("SiteVisit", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

    # Relationships for new models
    flash_offers = relationship("FlashOffer", back_populates="user")
    vip_access_logs = relationship("VIPAccessLog", back_populates="user")

class UserAction(Base):
    __tablename__ = "user_actions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    action_type = Column(String, index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    value = Column(Float, default=0.0) # For monetary value in RFM
    
    user = relationship("User", back_populates="actions")

class UserSegment(Base):
    __tablename__ = "user_segments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rfm_group = Column(String(50), nullable=False)
    risk_profile = Column(String(50), nullable=False)
    name = Column(String(50), nullable=True)

    # Relationship
    user = relationship("User", back_populates="segment", uselist=False) # One-to-one

class SiteVisit(Base):
    __tablename__ = "site_visits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False) # Relates to User model
    source = Column(String(50), nullable=False) # e.g., "webapp", "email_link"
    visit_timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="site_visits")


class InviteCode(Base):
    __tablename__ = "invite_codes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(6), unique=True, nullable=False, index=True)
    is_used = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserReward(Base):
    __tablename__ = "user_rewards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reward_type = Column(String(50), nullable=False)
    reward_value = Column(String(255), nullable=False)
    awarded_at = Column(DateTime, default=datetime.utcnow)
    trigger_action_id = Column(Integer, ForeignKey("user_actions.id"), nullable=True)
    source_description = Column(Text, nullable=True)  # Add missing column

    # Relationship
    # user = relationship("User", back_populates="rewards", primaryjoin="UserReward.user_id == User.id")  # 임시 비활성화
    # trigger_action = relationship("UserAction", primaryjoin="UserReward.trigger_action_id == UserAction.id")  # 임시 비활성화

class AdultContent(Base):
    __tablename__ = "adult_content"

    id = Column(Integer, primary_key=True, index=True)
    stage = Column(Integer, unique=True, nullable=False, index=True) # e.g., 1, 2, 3
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    thumbnail_url = Column(String(255), nullable=True)
    media_url = Column(String(255), nullable=True) # Video or full-res image
    # 랭크 기반 접근 제어 - STANDARD, PREMIUM, VIP 등
    required_rank = Column(String(20), default="STANDARD", nullable=False)
    # RFM 세그먼트 기반 접근 제어 (기존 유지)
    required_segment_level = Column(Integer, default=1, nullable=False)
    # Add any other relevant fields like 'duration', 'tags', etc.

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    message = Column(String(500), nullable=False)
    is_sent = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    sent_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="notifications")

# New Models

class FlashOffer(Base):
    __tablename__ = "flash_offers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content_id = Column(Integer, ForeignKey("adult_content.id"), nullable=False)
    original_price = Column(Integer, nullable=False)
    discounted_price = Column(Integer, nullable=False)
    discount_rate = Column(Float, nullable=False)
    trigger_reason = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    is_purchased = Column(Boolean, default=False)
    purchased_at = Column(DateTime, nullable=True)
    target_stage_name = Column(String(50), nullable=False, default="Full") # Added field

    user = relationship("User", back_populates="flash_offers")
    adult_content = relationship("AdultContent") # Assuming one-way relationship for now

class VIPAccessLog(Base):
    __tablename__ = "vip_access_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content_id = Column(Integer, ForeignKey("adult_content.id"), nullable=False)
    access_tier = Column(String(20))
    tokens_spent = Column(Integer)
    accessed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="vip_access_logs")
    adult_content = relationship("AdultContent") # Assuming one-way relationship for now

class GameLog(Base):
    __tablename__ = "game_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    game_type = Column(String(50), nullable=False)
    result = Column(String(50), nullable=False)
    tokens_spent = Column(Integer, default=0)
    reward_given = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User")


class UserStreak(Base):
    __tablename__ = "user_streaks"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    win_streak = Column(Integer, default=0)
    loss_streak = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")


class TokenTransfer(Base):
    __tablename__ = "token_transfers"

    id = Column(Integer, primary_key=True, index=True)
    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    to_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    amount = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    from_user = relationship("User", foreign_keys=[from_user_id])
    to_user = relationship("User", foreign_keys=[to_user_id])


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    game_type = Column(String(50), nullable=False)  # slot, roulette, gacha
    bet_amount = Column(Integer, default=0)
    result = Column(String(255), nullable=True)
    payout = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


# In User model, add the other side of the relationship if you want two-way population
# class User(Base):
#   ...
#   rewards = relationship("UserReward", back_populates="user")
#   site_visits = relationship("SiteVisit", back_populates="user")
#   notifications = relationship("Notification", back_populates="user") # This is now added above
#   flash_offers = relationship("FlashOffer", back_populates="user")
#   vip_access_logs = relationship("VIPAccessLog", back_populates="user")
class LoginAttempt(Base):
    """로그인 시도 기록 테이블"""
    __tablename__ = "login_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(String(50), nullable=False, index=True)
    ip_address = Column(String(45), nullable=False, index=True)  # IPv6 지원
    success = Column(Boolean, nullable=False, index=True)
    attempted_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    user_agent = Column(String(500), nullable=True)
    failure_reason = Column(String(100), nullable=True)
    
    # 성능 최적화를 위한 복합 인덱스
    __table_args__ = (
        Index("ix_login_attempts_site_id_attempted_at", "site_id", "attempted_at"),
        Index("ix_login_attempts_ip_attempted_at", "ip_address", "attempted_at"),
    )


class RefreshToken(Base):
    """리프레시 토큰 관리 테이블"""
    __tablename__ = "refresh_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(128), unique=True, nullable=False, index=True)
    device_fingerprint = Column(String(128), nullable=True, index=True)
    ip_address = Column(String(45), nullable=False)
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)
    last_used_at = Column(DateTime, nullable=True)
    is_revoked = Column(Boolean, default=False, nullable=False, index=True)
    revoked_at = Column(DateTime, nullable=True)
    revoke_reason = Column(String(50), nullable=True)
    
    # 관계
    user = relationship("User")
    
    # 인덱스
    __table_args__ = (
        Index("ix_refresh_tokens_user_id_created_at", "user_id", "created_at"),
        Index("ix_refresh_tokens_expires_at_revoked", "expires_at", "is_revoked"),
    )


class UserSession(Base):
    """사용자 세션 관리 테이블"""
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String(128), unique=True, nullable=False, index=True)
    device_fingerprint = Column(String(128), nullable=True, index=True)
    ip_address = Column(String(45), nullable=False, index=True)
    user_agent = Column(String(500), nullable=True)
    login_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    last_activity_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    logout_at = Column(DateTime, nullable=True)
    logout_reason = Column(String(50), nullable=True)
    
    # 관계
    user = relationship("User")
    
    # 인덱스
    __table_args__ = (
        Index("ix_user_sessions_user_id_active", "user_id", "is_active"),
        Index("ix_user_sessions_last_activity_active", "last_activity_at", "is_active"),
        Index("ix_user_sessions_expires_at_active", "expires_at", "is_active"),
    )


class SecurityEvent(Base):
    """보안 이벤트 로그 테이블"""
    __tablename__ = "security_events"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    event_type = Column(String(50), nullable=False, index=True)
    severity = Column(String(20), default="INFO", nullable=False, index=True)
    description = Column(String(500), nullable=False)
    ip_address = Column(String(45), nullable=False, index=True)
    user_agent = Column(String(500), nullable=True)
    metadata = Column(String(1000), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # 관계
    user = relationship("User")
    
    # 인덱스
    __table_args__ = (
        Index("ix_security_events_type_created_at", "event_type", "created_at"),
        Index("ix_security_events_severity_created_at", "severity", "created_at"),
        Index("ix_security_events_user_id_created_at", "user_id", "created_at"),
    )


#   age_verification_records = relationship("AgeVerificationRecord", back_populates="user")
#   ...


# Note for developer:
# After defining or updating models, an Alembic migration is needed:
# 1. alembic revision -m "add_notifications_table" (or a more descriptive name)
# 2. Edit the generated migration script in alembic/versions/ to ensure it correctly
#    reflects the model definitions (e.g., op.create_table(...)).
# 3. alembic upgrade head
#
# Also, ensure alembic/env.py is configured to use this Base:
# from app.models import Base # This should already be done
# target_metadata = Base.metadata # This should already be done
