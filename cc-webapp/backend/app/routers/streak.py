"""Streak API: daily/continuous action streak status and updates"""
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from ..dependencies import get_current_user
from ..models.auth_models import User
from ..utils.redis import (
    update_streak_counter,
    get_streak_counter,
    get_streak_ttl,
    record_attendance_day,
    get_attendance_month,
    get_streak_protection,
    set_streak_protection,
)

router = APIRouter(prefix="/api/streak", tags=["Streaks"])

DEFAULT_ACTION = "SLOT_SPIN"


class StreakStatus(BaseModel):
    action_type: str
    count: int
    ttl_seconds: Optional[int] = None
    next_reward: Optional[str] = None


@router.get("/status", response_model=StreakStatus)
async def status(
    action_type: str = Query(DEFAULT_ACTION),
    current_user: User = Depends(get_current_user),
):
    cnt = get_streak_counter(str(current_user.id), action_type)
    ttl = get_streak_ttl(str(current_user.id), action_type)
    next_reward = _calc_next_reward(cnt + 1)
    return StreakStatus(action_type=action_type, count=cnt, ttl_seconds=ttl, next_reward=next_reward)


class TickRequest(BaseModel):
    action_type: Optional[str] = None


@router.post("/tick", response_model=StreakStatus)
async def tick(
    body: TickRequest,
    current_user: User = Depends(get_current_user),
):
    action_type = body.action_type or DEFAULT_ACTION
    cnt = update_streak_counter(str(current_user.id), action_type, increment=True)
    ttl = get_streak_ttl(str(current_user.id), action_type)
    next_reward = _calc_next_reward(cnt + 1)
    # 출석 기록: 오늘 날짜를 YYYY-MM-DD로 저장 (월별 집합)
    try:
        today = datetime.utcnow().date().isoformat()
        record_attendance_day(str(current_user.id), action_type, today)
    except Exception:
        # 출석 기록 실패는 본 API 성공과 분리
        pass
    return StreakStatus(action_type=action_type, count=cnt, ttl_seconds=ttl, next_reward=next_reward)


class ResetRequest(BaseModel):
    action_type: Optional[str] = None


@router.post("/reset")
async def reset(
    body: ResetRequest,
    current_user: User = Depends(get_current_user),
):
    action_type = body.action_type or DEFAULT_ACTION
    # Use update_streak_counter with increment=False to reset
    update_streak_counter(str(current_user.id), action_type, increment=False)
    return {"ok": True}


@router.get("/next-reward")
async def next_reward(
    action_type: str = Query(DEFAULT_ACTION),
    current_user: User = Depends(get_current_user),
):
    cnt = get_streak_counter(str(current_user.id), action_type)
    return {"next_reward": _calc_next_reward(cnt + 1)}


def _calc_next_reward(next_count: int) -> str:
    # Simple tiering example; adjust to product needs
    if next_count % 7 == 0:
        return "Epic Chest"
    if next_count % 3 == 0:
        return "Rare Chest"
    return "Coins + XP"


# -----------------
# Attendance (출석)
# -----------------
class AttendanceHistory(BaseModel):
    action_type: str
    year: int
    month: int
    days: List[str]


@router.get("/history", response_model=AttendanceHistory)
async def history(
    action_type: str = Query(DEFAULT_ACTION),
    year: int = Query(..., ge=1970, le=2100),
    month: int = Query(..., ge=1, le=12),
    current_user: User = Depends(get_current_user),
):
    days = get_attendance_month(str(current_user.id), action_type, year, month)
    return AttendanceHistory(action_type=action_type, year=year, month=month, days=days)


# ----------------------
# Streak Protection 토글
# ----------------------
class ProtectionStatus(BaseModel):
    action_type: str
    enabled: bool


@router.get("/protection", response_model=ProtectionStatus)
async def protection_status(
    action_type: str = Query(DEFAULT_ACTION),
    current_user: User = Depends(get_current_user),
):
    enabled = get_streak_protection(str(current_user.id), action_type)
    return ProtectionStatus(action_type=action_type, enabled=enabled)


class ProtectionRequest(BaseModel):
    action_type: Optional[str] = None
    enabled: bool


@router.post("/protection", response_model=ProtectionStatus)
async def set_protection(
    body: ProtectionRequest,
    current_user: User = Depends(get_current_user),
):
    action_type = body.action_type or DEFAULT_ACTION
    set_streak_protection(str(current_user.id), action_type, body.enabled)
    enabled = get_streak_protection(str(current_user.id), action_type)
    return ProtectionStatus(action_type=action_type, enabled=enabled)
