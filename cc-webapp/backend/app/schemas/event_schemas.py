from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, List, Any

# Event Schemas
class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    event_type: str
    start_date: datetime
    end_date: datetime
    rewards: Dict[str, Any]
    requirements: Optional[Dict[str, Any]] = {}
    image_url: Optional[str] = None
    priority: int = 0

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    end_date: Optional[datetime] = None
    rewards: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class EventResponse(EventBase):
    id: int
    is_active: bool
    created_at: datetime
    participation_count: Optional[int] = 0
    user_participation: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True

# Event Participation Schemas
class EventParticipationBase(BaseModel):
    event_id: int
    progress: Optional[Dict[str, Any]] = {}

class EventJoin(BaseModel):
    event_id: int

class EventProgressUpdate(BaseModel):
    progress: Dict[str, Any]

class EventParticipationResponse(EventParticipationBase):
    id: int
    user_id: int
    completed: bool
    claimed_rewards: bool
    joined_at: datetime
    completed_at: Optional[datetime] = None
    event: Optional[EventResponse] = None
    
    class Config:
        from_attributes = True

# Mission Schemas
class MissionBase(BaseModel):
    title: str
    description: Optional[str] = None
    mission_type: str
    category: Optional[str] = None
    target_value: int
    target_type: str
    rewards: Dict[str, Any]
    requirements: Optional[Dict[str, Any]] = {}
    reset_period: Optional[str] = None
    icon: Optional[str] = None

class MissionCreate(MissionBase):
    pass

class MissionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_value: Optional[int] = None
    rewards: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class MissionResponse(MissionBase):
    id: int
    is_active: bool
    sort_order: int
    created_at: datetime
    user_progress: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True

# User Mission Schemas
class UserMissionProgress(BaseModel):
    mission_id: int
    progress_increment: int

class UserMissionResponse(BaseModel):
    id: int
    user_id: int
    mission_id: int
    current_progress: int
    completed: bool
    claimed: bool
    started_at: datetime
    completed_at: Optional[datetime] = None
    claimed_at: Optional[datetime] = None
    reset_at: Optional[datetime] = None
    mission: Optional[MissionResponse] = None
    
    class Config:
        from_attributes = True

class ClaimRewardRequest(BaseModel):
    mission_id: Optional[int] = None
    event_id: Optional[int] = None

class ClaimRewardResponse(BaseModel):
    success: bool
    rewards: Dict[str, Any]
    message: str