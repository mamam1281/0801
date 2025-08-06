from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..dependencies import get_current_user
from ..models.auth_models import User
from ..services.event_service import EventService, MissionService
from ..schemas.event_schemas import *

router = APIRouter(prefix="/api/events", tags=["Events & Missions"])

# 이벤트 엔드포인트
@router.get("/", response_model=List[EventResponse])
async def get_active_events(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """활성 이벤트 목록 조회"""
    events = EventService.get_active_events(db)
    
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

@router.get("/{event_id}", response_model=EventResponse)
async def get_event_detail(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """이벤트 상세 조회"""
    event = EventService.get_event_by_id(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="이벤트를 찾을 수 없습니다")
    
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
        return participation
    except Exception as e:
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
        return participation
    except Exception as e:
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
        return ClaimRewardResponse(
            success=True,
            rewards=rewards,
            message="보상을 성공적으로 수령했습니다!"
        )
    except ValueError as e:
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
    
    return missions

@router.get("/missions/weekly", response_model=List[UserMissionResponse])
async def get_weekly_missions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """주간 미션 목록 조회"""
    return MissionService.get_user_missions(db, current_user.id, 'weekly')

@router.get("/missions/all", response_model=List[UserMissionResponse])
async def get_all_missions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """모든 미션 목록 조회"""
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
        return ClaimRewardResponse(
            success=True,
            rewards=rewards,
            message="미션 보상을 성공적으로 수령했습니다!"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))