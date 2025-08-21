"""
이벤트 라우터 수정
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Body
import logging
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from ..database import get_db
from ..dependencies import get_current_user
from ..models.auth_models import User
from ..models.event_models import Event, EventParticipation
from ..services.event_service import EventService, MissionService
from sqlalchemy import or_
from ..schemas.event_schemas import *

router = APIRouter(prefix="/api/events", tags=["Events & Missions"])

# --- Metrics (best-effort) ---
try:  # pragma: no cover - optional metrics
    from prometheus_client import Counter  # type: ignore
    EVENT_MISSION_COUNTER = Counter(
        "event_mission_requests_total",
        "Events & Missions 엔드포인트 호출 카운터",
        ["endpoint", "action", "status", "auth"],
    )
except Exception:  # pragma: no cover
    EVENT_MISSION_COUNTER = None

def _metric(endpoint: str, action: str, status: str, auth: str):
    if EVENT_MISSION_COUNTER:
        try:
            EVENT_MISSION_COUNTER.labels(endpoint=endpoint, action=action, status=status, auth=auth).inc()
        except Exception:
            pass

logger = logging.getLogger(__name__)

# 이벤트 엔드포인트
@router.get("/", response_model=List[EventResponse])
async def get_active_events(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """활성 이벤트 목록 조회"""
    auth = "y" if current_user else "n"
    try:
        events = EventService.get_active_events(db)
        _metric("events", "list", "success", auth)
        # 사용자 참여 정보 추가
        for event in events:
            participation = db.query(EventParticipation).filter(
                EventParticipation.user_id == current_user.id,
                EventParticipation.event_id == event.id
            ).first()
            if participation:
                event.user_participation = {
                    "joined": True,
                    "progress": participation.progress,
                    "completed": participation.completed,
                    "claimed": participation.claimed_rewards
                }
        return events
    except HTTPException:
        _metric("events", "list", "error", auth)
        raise

# -----------------
# Admin / CRUD (soft delete aware)
# -----------------

class EventAdminCreate(EventCreate):
    pass

class EventAdminUpdate(EventUpdate):
    pass

@router.post("/admin", response_model=EventResponse)
async def admin_create_event(
    data: EventAdminCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="권한 없음")
    ev = Event(**data.model_dump())
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev

@router.get("/admin/list", response_model=List[EventResponse])
async def admin_list_events(
    include_deleted: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="권한 없음")
    q = db.query(Event)
    if not include_deleted:
        q = q.filter(Event.deleted_at.is_(None))
    return q.order_by(Event.id.desc()).all()

@router.put("/admin/{event_id}", response_model=EventResponse)
async def admin_update_event(
    event_id: int,
    data: EventAdminUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="권한 없음")
    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="이벤트 없음")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(ev, k, v)
    db.commit()
    db.refresh(ev)
    return ev

@router.delete("/admin/{event_id}")
async def admin_soft_delete_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="권한 없음")
    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="이벤트 없음")
    if ev.deleted_at is None:
        from datetime import datetime as _dt
        ev.deleted_at = _dt.utcnow()
        db.commit()
    return {"deleted": True, "deleted_at": ev.deleted_at}

@router.post("/admin/{event_id}/restore")
async def admin_restore_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="권한 없음")
    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="이벤트 없음")
    ev.deleted_at = None
    db.commit()
    return {"restored": True}

@router.get("/{event_id}", response_model=EventResponse)
async def get_event_detail(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """이벤트 상세 조회"""
    event = EventService.get_event_by_id(db, event_id)
    if not event:
        _metric("events", "detail", "not_found", "y")
        raise HTTPException(status_code=404, detail="이벤트를 찾을 수 없습니다")
    _metric("events", "detail", "success", "y")
    return event

@router.post("/join", response_model=EventParticipationResponse)
async def join_event(
    request: EventJoin,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """이벤트 참여"""
    try:
        participation = EventService.join_event(
            db, current_user.id, request.event_id
        )
        _metric("events", "join", "success", "y")
        return participation
    except Exception as e:
        _metric("events", "join", "error", "y")
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/progress/{event_id}", response_model=EventParticipationResponse)
async def update_event_progress(
    event_id: int,
    request: EventProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """이벤트 진행 상황 업데이트"""
    try:
        participation = EventService.update_event_progress(
            db, current_user.id, event_id, request.progress
        )
        _metric("events", "progress", "success", "y")
        return participation
    except Exception as e:
        _metric("events", "progress", "error", "y")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/claim/{event_id}", response_model=ClaimRewardResponse)
async def claim_event_rewards(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """이벤트 보상 수령"""
    try:
        rewards = EventService.claim_event_rewards(
            db, current_user.id, event_id
        )
        _metric("events", "claim", "success", "y")
        return ClaimRewardResponse(
            success=True,
            rewards=rewards,
            message="보상을 성공적으로 수령했습니다!"
        )
    except ValueError as e:
        _metric("events", "claim", "error", "y")
        raise HTTPException(status_code=400, detail=str(e))

# 미션 엔드포인트
@router.get("/missions/daily", response_model=List[UserMissionResponse])
async def get_daily_missions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """일일 미션 목록 조회"""
    missions = MissionService.get_user_missions(db, current_user.id, 'daily')
    
    # 미션이 없으면 초기화
    if not missions:
        MissionService.initialize_daily_missions(db, current_user.id)
        missions = MissionService.get_user_missions(db, current_user.id, 'daily')
    
    _metric("missions", "list_daily", "success", "y")
    return missions

@router.get("/missions/weekly", response_model=List[UserMissionResponse])
async def get_weekly_missions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """주간 미션 목록 조회"""
    _metric("missions", "list_weekly", "success", "y")
    return MissionService.get_user_missions(db, current_user.id, 'weekly')

@router.get("/missions/all", response_model=List[UserMissionResponse])
async def get_all_missions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """모든 미션 목록 조회"""
    _metric("missions", "list_all", "success", "y")
    return MissionService.get_user_missions(db, current_user.id)

@router.put("/missions/progress", response_model=Dict)
async def update_mission_progress(
    request: UserMissionProgress,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """미션 진행 상황 업데이트"""
    # 미션 타입에 따라 진행 상황 업데이트
    completed = MissionService.update_mission_progress(
        db, current_user.id,
        request.mission_id,
        request.progress_increment
    )
    _metric("missions", "progress", "success", "y")
    
    return {
        "updated": True,
        "completed_missions": len(completed),
        "missions": completed
    }

@router.post("/missions/claim/{mission_id}", response_model=ClaimRewardResponse)
async def claim_mission_rewards(
    mission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """미션 보상 수령"""
    try:
        rewards = MissionService.claim_mission_rewards(
            db, current_user.id, mission_id
        )
        _metric("missions", "claim", "success", "y")
        return ClaimRewardResponse(
            success=True,
            rewards=rewards,
            message="미션 보상을 성공적으로 수령했습니다!"
        )
    except ValueError as e:
        _metric("missions", "claim", "error", "y")
        raise HTTPException(status_code=400, detail=str(e))
