from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from ..database import Base

class Mission(Base):
    __tablename__ = "missions"
    __table_args__ = {'extend_existing': True}  # 이 줄 추가

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    mission_type = Column(String, nullable=False) # e.g., 'DAILY', 'WEEKLY', 'ACHIEVEMENT'
    category = Column(String) # 카테고리
    target_value = Column(Integer, nullable=False) # 목표 수치
    target_type = Column(String, nullable=False) # e.g., 'SLOT_SPIN', 'RPS_WIN'
    rewards = Column(JSON) # 리워드 정보
    requirements = Column(JSON) # 요구사항
    reset_period = Column(String) # 리셋 주기
    icon = Column(String) # 아이콘
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user_missions = relationship("UserMission", back_populates="mission")

class UserMission(Base):
    __tablename__ = "user_missions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mission_id = Column(Integer, ForeignKey("missions.id"), nullable=False)
    current_progress = Column(Integer, default=0)
    completed = Column(Boolean, default=False)
    claimed = Column(Boolean, default=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    claimed_at = Column(DateTime, nullable=True)
    reset_at = Column(DateTime, nullable=True)
    progress_version = Column(Integer, default=0)
    last_progress_at = Column(DateTime, nullable=True)
    
    # Relationships
    mission = relationship("Mission", back_populates="user_missions")
    mission = relationship("Mission", back_populates="user_missions")

    user = relationship("User")
    mission = relationship("Mission")
