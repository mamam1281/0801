"""Streak API: daily/continuous action streak status and updates"""
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from ..dependencies import get_current_user
from ..models.auth_models import User
from ..models.game_models import UserReward
from ..database import get_db
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
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


class StreakClaimResponse(BaseModel):
    action_type: str
    streak_count: int
    awarded_gold: int
    awarded_xp: int
    new_gold_balance: int
    claimed_at: datetime


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


# ----------------------
# Claim (일일 보상 지급)
# ----------------------
class ClaimRequest(BaseModel):
    action_type: Optional[str] = None

from app.services.reward_service import calculate_streak_daily_reward


# ----------------------
# Preview (보상 미리보기)
# ----------------------
class StreakPreviewResponse(BaseModel):
    action_type: str
    streak_count: int  # 현재 streak (claim 기준)
    claimed_today: bool
    claimable: bool  # 오늘 아직 수령 가능 여부
    today_reward_gold: int
    today_reward_xp: int
    next_day_reward_gold: int
    next_day_reward_xp: int


@router.get("/preview", response_model=StreakPreviewResponse)
async def preview(
    action_type: str = Query(DEFAULT_ACTION),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """현재 streak 및 오늘/내일 보상 금액 미리보기 제공.

    프론트는 이 엔드포인트를 사용해 클라이언트 산식 중복 제거.
    - streak_count: Redis 카운터 (증가 없이 조회)
    - claimed_today: 동일 UTC day idempotency key 존재 여부
    - claimable: streak_count>0 이고 claimed_today False
    - today_reward: streak_count 기반 산식
    - next_day_reward: streak_count+1 기반 산식
    """
    streak_count = get_streak_counter(str(current_user.id), action_type)
    if streak_count < 0:
        streak_count = 0
    # 멱등키 존재 여부 확인
    claim_day = datetime.utcnow().date().isoformat()
    idempotency_key = f"streak:{current_user.id}:{action_type}:{claim_day}"
    existing = (
        db.query(UserReward)
        .filter(UserReward.user_id == current_user.id, UserReward.idempotency_key == idempotency_key)
        .first()
    )
    claimed_today = existing is not None
    today_gold, today_xp = calculate_streak_daily_reward(streak_count) if streak_count > 0 else (0, 0)
    next_gold, next_xp = calculate_streak_daily_reward(streak_count + 1)
    return StreakPreviewResponse(
        action_type=action_type,
        streak_count=streak_count,
        claimed_today=claimed_today,
        claimable=(streak_count > 0 and not claimed_today),
        today_reward_gold=today_gold,
        today_reward_xp=today_xp,
        next_day_reward_gold=next_gold,
        next_day_reward_xp=next_xp,
    )


@router.post("/claim", response_model=StreakClaimResponse)
async def claim(
    body: ClaimRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    action_type = body.action_type or DEFAULT_ACTION
    # 현재 streak 읽기 (증가 없이)
    streak_count = get_streak_counter(str(current_user.id), action_type)
    if streak_count <= 0:
        raise HTTPException(status_code=400, detail="No active streak to claim")

    # 멱등키: user_id + action_type + UTC date
    claim_day = datetime.utcnow().date().isoformat()
    idempotency_key = f"streak:{current_user.id}:{action_type}:{claim_day}"

    # Redis/DB 멱등: Redis 플래그(선택적) 우선 확인 (존재 시 DB 조회 생략 가능)
    from app.utils.redis import get_redis
    try:
        r = get_redis()
        redis_flag_key = f"streak_claimed:{current_user.id}:{action_type}:{claim_day}"
        if r.get(redis_flag_key):
            existing = (
                db.query(UserReward)
                .filter(UserReward.user_id == current_user.id, UserReward.idempotency_key == idempotency_key)
                .first()
            )
            if existing:
                return StreakClaimResponse(
                    action_type=action_type,
                    streak_count=streak_count,
                    awarded_gold=existing.gold_amount or 0,
                    awarded_xp=existing.xp_amount or 0,
                    new_gold_balance=current_user.gold_balance,
                    claimed_at=existing.created_at,
                )
    except Exception:
        pass

    # 이미 동일 날 보상 지급된 경우 DB user_rewards 조회
    existing = (
        db.query(UserReward)
        .filter(UserReward.user_id == current_user.id, UserReward.idempotency_key == idempotency_key)
        .first()
    )
    if existing:
        return StreakClaimResponse(
            action_type=action_type,
            streak_count=streak_count,
            awarded_gold=existing.gold_amount or 0,
            awarded_xp=existing.xp_amount or 0,
            new_gold_balance=current_user.gold_balance,
            claimed_at=existing.created_at,
        )

    gold, xp = calculate_streak_daily_reward(streak_count)

    # 트랜잭션 처리
    try:
        # 유저 골드/XP 업데이트 (모델 필드 명세에 따라 조정 필요)
        current_user.gold_balance = (current_user.gold_balance or 0) + gold
        if hasattr(current_user, 'experience'):
            current_user.experience = (current_user.experience or 0) + xp

        reward = UserReward(
            user_id=current_user.id,
            reward_type="STREAK_DAILY",
            gold_amount=gold,
            xp_amount=xp,
            reward_metadata={
                "action_type": action_type,
                "streak_count": streak_count,
                "formula": "C_exp_decay_v1",
            },
            idempotency_key=idempotency_key,
        )
        db.add(reward)
        db.add(current_user)
        db.commit()
        db.refresh(reward)
    except IntegrityError:
        db.rollback()
        # 재경합 시 재조회 (멱등)
        reward = (
            db.query(UserReward)
            .filter(UserReward.user_id == current_user.id, UserReward.idempotency_key == idempotency_key)
            .first()
        )
        if not reward:
            raise HTTPException(status_code=500, detail="Failed to finalize claim")
    except Exception:
        db.rollback()
        raise

    # Redis 플래그 TTL = 1일 (UTC 자정 교차 허용: 26h 여유)
    try:
        if r:
            r.set(redis_flag_key, "1", ex=60*60*26)
    except Exception:
        pass

    return StreakClaimResponse(
        action_type=action_type,
        streak_count=streak_count,
        awarded_gold=gold,
        awarded_xp=xp,
        new_gold_balance=current_user.gold_balance,
        claimed_at=reward.created_at,
    )


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
