from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from datetime import datetime, timedelta

Base = declarative_base()

class GamePlay(Base):
    """사용자 게임 플레이 횟수 추적을 위한 모델"""
    __tablename__ = "game_plays"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    game_type = Column(String, index=True, nullable=False)  # "slot", "crash", "rps", "gacha"
    play_count = Column(Integer, default=0)
    last_reset = Column(DateTime, default=func.now())
    last_played = Column(DateTime, default=func.now())
    
    @property
    def next_reset(self):
        """다음 리셋 시간 반환 (다음날 00:00)"""
        next_day = self.last_reset + timedelta(days=1)
        return datetime(next_day.year, next_day.month, next_day.day, 0, 0, 0)
    
    def should_reset(self):
        """일일 리셋이 필요한지 확인"""
        now = datetime.now()
        next_reset_time = self.next_reset
        return now >= next_reset_time
