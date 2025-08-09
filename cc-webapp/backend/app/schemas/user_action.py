# 파일 위치: c:\Users\bdbd\Downloads\auto202506-a-main\auto202506-a-main\cc-webapp\backend\app\schemas\user_action.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserActionBase(BaseModel):
    user_id: int
    action_type: str
    value: Optional[float] = None

class UserActionCreate(UserActionBase):
    pass

class UserAction(UserActionBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True