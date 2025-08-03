from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class FeedbackBase(BaseModel):
    user_id: int
    action_type: str
    context: Optional[Dict[str, str]] = None
    
class FeedbackRequest(FeedbackBase):
    pass

class FeedbackResponse(BaseModel):
    message: str
    animation_key: Optional[str] = None
    sound_key: Optional[str] = None
    intensity: Optional[int] = None  # 1-5 scale for emotional intensity
    color_scheme: Optional[str] = None  # For UI color adaptation (e.g., "success", "warning", "danger")
    bonus_tokens: Optional[int] = None  # Any bonus tokens awarded with feedback
    
class FeedbackLog(FeedbackBase):
    id: int
    message: str
    animation_key: Optional[str] = None
    sound_key: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True