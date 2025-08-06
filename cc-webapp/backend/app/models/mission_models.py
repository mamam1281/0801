from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from ..database import Base

# Mission 클래스는 event_models.py로 이동했으므로 제거
# event_models.py에서 Mission을 import하여 사용합니다

class UserMissionProgress(Base):
    __tablename__ = "user_mission_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mission_id = Column(Integer, ForeignKey("missions.id"), nullable=False)
    current_count = Column(Integer, default=0)
    is_completed = Column(Boolean, default=False)
    is_claimed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    claimed_at = Column(DateTime, nullable=True)

    user = relationship("User")
    mission = relationship("Mission")
