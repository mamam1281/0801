from typing import List, Dict, Any
from pydantic import BaseModel, Field

class SlotSpinRequest(BaseModel):
    user_id: str
    bet_amount: int = Field(..., ge=5000, le=10000)
    lines: int = Field(default=3, ge=1, le=5)
    vip_mode: bool = False

class SlotSpinResponse(BaseModel):
    spin_id: str
    result: List[List[int]]
    win_lines: List[int]
    win_amount: int
    multiplier: int
    remaining_spins: int
    streak_count: int
    special_event: str = None
