from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base

class UserReward(Base):
    __tablename__ = "user_rewards"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    amount = Column(Integer, default=0)
    reward_type = Column(String, default="coin")  # coin, gem, token, item, etc.
    transaction_id = Column(String, unique=True, index=True)
    source = Column(String, index=True)  # slot_win, crash_win, daily_bonus, etc.
    source_details = Column(String)
    created_at = Column(DateTime, default=func.now())
    
    # For item rewards
    item_id = Column(String, nullable=True)
    item_name = Column(String, nullable=True)
    item_quantity = Column(Integer, nullable=True, default=1)
