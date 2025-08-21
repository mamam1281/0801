"""Streak API: daily/continuous action streak status and updates"""
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
import logging

from ..dependencies import get_current_user
from ..models.auth_models import User
from ..models.game_models import UserReward
from ..database import get_db
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from ..utils.redis import (
    update_streak_counter,
    get_streak_counter,
    get_streak_ttl,
    record_attendance_day,
    get_attendance_month,
    get_streak_protection,
    set_streak_protection,
)
from app.utils.redis import get_redis  # 일일 중복 가드용 직접 Redis 접근

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
    body: TickRequest | None = None,
    current_user: User = Depends(get_current_user),
):
    if body is None:
        body = TickRequest()
    action_type = body.action_type or DEFAULT_ACTION

    # ------------------------------
    # 일일 중복 증가 가드 (UTC 기준)
    # 동일 user/action/date 조합에서 하루 1회만 streak 증가.
    # Redis NX 키: user:{id}:streak_daily_lock:{action}:{YYYY-MM-DD}
    # TTL 48h: 자정 교차 시점 여유 확보.
    # Redis 미연결/예외 시엔 기존 동작(증가) 유지 → 가용성 우선.
    # ------------------------------
    allow_increment = True
    today_iso = datetime.utcnow().date().isoformat()
    daily_lock_key = f"user:{current_user.id}:streak_daily_lock:{action_type}:{today_iso}"
    try:
        r = get_redis()
        if r is not None:
            # setnx (nx=True) 실패하면 이미 오늘 증가 처리된 것 → 증가 생략
            if not r.set(daily_lock_key, "1", nx=True, ex=60 * 60 * 48):
                allow_increment = False
    except Exception:
        # Redis 문제는 가드 비활성(증가 허용)
        pass

    if allow_increment:
        cnt = update_streak_counter(str(current_user.id), action_type, increment=True)
    else:
        cnt = get_streak_counter(str(current_user.id), action_type)

    ttl = get_streak_ttl(str(current_user.id), action_type)
    next_reward = _calc_next_reward(cnt + 1)

    # 출석 기록 (증가 여부와 무관하게 하루 한 번 기록 시도 – SADD idempotent)
    try:
        record_attendance_day(str(current_user.id), action_type, today_iso)
    except Exception:
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
from app.core.config import settings

logger = logging.getLogger(__name__)


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
        
    # 오늘 이미 보상을 받았는지 확인
    claim_day = datetime.utcnow().date().isoformat()
    # 기존 코드에서 UserReward.created_at 필드를 참조했으나 모델에는 claimed_at 만 존재
    # streak 일일 보상은 claimed_at 기준으로 '오늘' 수령 여부 확인
    existing_today = (
        db.query(UserReward)
        .filter(
            UserReward.user_id == current_user.id,
            UserReward.reward_type == "STREAK_DAILY",
            func.date(UserReward.claimed_at) == func.date(datetime.utcnow())
        )
        .first()
    )
    if existing_today:
        raise HTTPException(status_code=400, detail="한 회원당 하루에 1번만 연속 보상을 받을 수 있습니다")

    # 멱등키: user_id + action_type + UTC date
    claim_day = datetime.utcnow().date().isoformat()
    idempotency_key = f"streak:{current_user.id}:{action_type}:{claim_day}"

    # Redis/DB 멱등: Redis 플래그(선택적) 우선 확인 (존재 시 DB 조회 생략 가능)
    from app.utils.redis import get_redis
    r = None
    redis_flag_key = f"streak_claimed:{current_user.id}:{action_type}:{claim_day}"
    try:
        r = get_redis()
        if r.get(redis_flag_key):
            existing = (
                db.query(UserReward)
                .filter(UserReward.user_id == current_user.id, UserReward.idempotency_key == idempotency_key)
                .first()
            )
            if existing:
                # 안전한 gold balance 조회
                user_balance = getattr(current_user, 'gold_balance', None)
                if user_balance is None:
                    from app.models.auth_models import User as ORMUser
                    db_user = db.query(ORMUser).filter(ORMUser.id == current_user.id).first()
                    user_balance = getattr(db_user, 'gold_balance', 0) if db_user else 0
                return StreakClaimResponse(
                    action_type=action_type,
                    streak_count=streak_count,
                    awarded_gold=existing.gold_amount or 0,
                    awarded_xp=existing.xp_amount or 0,
                    new_gold_balance=user_balance,
                    claimed_at=existing.claimed_at,
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
        user_balance = getattr(current_user, 'gold_balance', None)
        if user_balance is None:
            from app.models.auth_models import User as ORMUser
            db_user = db.query(ORMUser).filter(ORMUser.id == current_user.id).first()
            user_balance = getattr(db_user, 'gold_balance', 0) if db_user else 0
        return StreakClaimResponse(
            action_type=action_type,
            streak_count=streak_count,
            awarded_gold=existing.gold_amount or 0,
            awarded_xp=existing.xp_amount or 0,
            new_gold_balance=user_balance,
            claimed_at=existing.claimed_at,
        )

    gold, xp = calculate_streak_daily_reward(streak_count)

    # 트랜잭션 처리
    orm_user = None
    try:
        from app.models.auth_models import User as ORMUser  # 지연 import로 순환참조 회피
        orm_user = db.query(ORMUser).filter(ORMUser.id == current_user.id).first()
        if orm_user:
            orm_user.gold_balance = (getattr(orm_user, 'gold_balance', 0) or 0) + gold
            if hasattr(orm_user, 'experience'):
                try:
                    orm_user.experience = (orm_user.experience or 0) + xp
                except Exception:
                    pass
        reward = UserReward(
            user_id=current_user.id,
            reward_type="STREAK_DAILY",
            gold_amount=gold,
            xp_amount=xp,
            reward_metadata={
                "action_type": action_type,
                "streak_count": streak_count,
                "formula": "C_exp_decay_v1",
                "is_user_action": True,
            },
            idempotency_key=idempotency_key,
            claimed_at=datetime.utcnow(),
        )
        db.add(reward)
        if orm_user:
            db.add(orm_user)
        db.commit()
        db.refresh(reward)
    except IntegrityError:
        db.rollback()
        # 멱등 경합: 이미 존재하면 재사용
        reward = (
            db.query(UserReward)
            .filter(UserReward.user_id == current_user.id, UserReward.idempotency_key == idempotency_key)
            .first()
        )
        if not reward:
            raise HTTPException(status_code=500, detail="Failed to finalize claim")
    except Exception as e:
        db.rollback()
        debug_context = {
            "user_id": getattr(current_user, 'id', None),
            "action_type": action_type,
            "streak_count": streak_count,
            "idempotency_key": idempotency_key,
            "has_orm_user": orm_user is not None,
        }
        logger.exception("[streak.claim] 내부 오류 발생: %s | context=%s", type(e).__name__, debug_context)
        detail = "streak claim failed"
        if getattr(settings, 'ENV', 'production') in ("test", "local", "dev"):
            detail += f": {type(e).__name__}"
        raise HTTPException(status_code=500, detail=detail)

    # 성공 경로
    try:
        if r:
            r.set(redis_flag_key, "1", ex=60 * 60 * 26)  # 26h
    except Exception:
        pass

    if orm_user is not None:
        new_balance = getattr(orm_user, 'gold_balance', 0)
    else:
        # current_user 가 단순 객체일 가능성 고려
        if not hasattr(current_user, 'gold_balance'):
            try:
                from app.models.auth_models import User as ORMUser
                db_user2 = db.query(ORMUser).filter(ORMUser.id == current_user.id).first()
                new_balance = getattr(db_user2, 'gold_balance', 0) if db_user2 else 0
            except Exception:
                new_balance = 0
        else:
            # reward commit 후 current_user.gold_balance 는 갱신 안됐을 수 있으니 증가 추정
            new_balance = (getattr(current_user, 'gold_balance', 0) or 0) + gold

    logger.info(
        "[streak.claim] SUCCESS user_id=%s action=%s streak=%s gold=%s xp=%s new_balance=%s",
        getattr(current_user, 'id', None),
        action_type,
        streak_count,
        gold,
        xp,
        new_balance,
    )
    return StreakClaimResponse(
        action_type=action_type,
        streak_count=streak_count,
        awarded_gold=gold,
        awarded_xp=xp,
        new_gold_balance=new_balance,
        claimed_at=reward.claimed_at,
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
