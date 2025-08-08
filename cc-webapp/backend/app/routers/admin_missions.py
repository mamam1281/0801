from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body, status
from typing import List, Optional
from pydantic import BaseModel

from ..database import get_db
from ..dependencies import get_current_user
from ..models.event_models import Mission
from ..schemas.event_schemas import MissionCreate, MissionUpdate, MissionResponse

router = APIRouter(prefix="/api/admin/missions", tags=["Admin Missions"])


class _AdminUser(BaseModel):
    id: int
    is_admin: bool


def require_admin_access(current_user = Depends(get_current_user)) -> _AdminUser:
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return _AdminUser(id=getattr(current_user, "id", 0), is_admin=True)


@router.get("/", response_model=List[MissionResponse])
def list_missions(
    admin_user: _AdminUser = Depends(require_admin_access),
    db = Depends(get_db),
    q: Optional[str] = Query(None),
    mtype: Optional[str] = Query(None, alias="type"),
    active: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    query = db.query(Mission)
    if q:
        query = query.filter(Mission.title.ilike(f"%{q}%"))
    if mtype:
        query = query.filter(Mission.mission_type == mtype)
    if active is not None:
        query = query.filter(Mission.is_active == active)
    missions = query.order_by(Mission.sort_order.asc(), Mission.created_at.desc()).limit(limit).offset(offset).all()
    return missions


@router.post("/", response_model=MissionResponse, status_code=201)
def create_mission(
    payload: MissionCreate,
    admin_user: _AdminUser = Depends(require_admin_access),
    db = Depends(get_db),
):
    mi = Mission(
        title=payload.title,
        description=payload.description,
        mission_type=payload.mission_type,
        category=payload.category,
        target_value=payload.target_value,
        target_type=payload.target_type,
        rewards=payload.rewards,
        requirements=payload.requirements or {},
        reset_period=payload.reset_period,
        icon=payload.icon,
        is_active=True,
    )
    db.add(mi)
    db.commit()
    db.refresh(mi)
    return mi


@router.put("/{mission_id}", response_model=MissionResponse)
def update_mission(
    mission_id: int = Path(..., ge=1),
    payload: MissionUpdate = Body(...),
    admin_user: _AdminUser = Depends(require_admin_access),
    db = Depends(get_db),
):
    mi: Mission = db.query(Mission).filter(Mission.id == mission_id).first()
    if not mi:
        raise HTTPException(status_code=404, detail="Mission not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(mi, field, value)
    db.commit()
    db.refresh(mi)
    return mi


@router.delete("/{mission_id}", status_code=204)
def delete_mission(
    mission_id: int = Path(..., ge=1),
    admin_user: _AdminUser = Depends(require_admin_access),
    db = Depends(get_db),
):
    mi: Mission = db.query(Mission).filter(Mission.id == mission_id).first()
    if not mi:
        raise HTTPException(status_code=404, detail="Mission not found")
    db.delete(mi)
    db.commit()
    return None


class ActivateRequest(BaseModel):
    is_active: bool = True


@router.post("/{mission_id}/activate", response_model=MissionResponse)
def set_mission_active(
    mission_id: int = Path(..., ge=1),
    payload: ActivateRequest = Body(default=ActivateRequest()),
    admin_user: _AdminUser = Depends(require_admin_access),
    db = Depends(get_db),
):
    mi: Mission = db.query(Mission).filter(Mission.id == mission_id).first()
    if not mi:
        raise HTTPException(status_code=404, detail="Mission not found")
    mi.is_active = payload.is_active
    db.commit()
    db.refresh(mi)
    return mi
