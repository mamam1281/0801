from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body, status
from typing import List, Optional
from pydantic import BaseModel

from ..database import get_db
from ..dependencies import get_current_user
from ..models.event_models import Event
from ..schemas.event_schemas import EventCreate, EventUpdate, EventResponse

router = APIRouter(prefix="/api/admin/events", tags=["Admin Events"])


class _AdminUser(BaseModel):
    id: int
    is_admin: bool


def require_admin_access(current_user = Depends(get_current_user)) -> _AdminUser:
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return _AdminUser(id=getattr(current_user, "id", 0), is_admin=True)


@router.get("/", response_model=List[EventResponse])
def list_events(
    admin_user: _AdminUser = Depends(require_admin_access),
    db = Depends(get_db),
    q: Optional[str] = Query(None),
    active: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    query = db.query(Event)
    if q:
        query = query.filter(Event.title.ilike(f"%{q}%"))
    if active is not None:
        query = query.filter(Event.is_active == active)
    events = query.order_by(Event.priority.desc(), Event.created_at.desc()).limit(limit).offset(offset).all()
    return events


@router.post("/", response_model=EventResponse, status_code=201)
def create_event(
    payload: EventCreate,
    admin_user: _AdminUser = Depends(require_admin_access),
    db = Depends(get_db),
):
    ev = Event(
        title=payload.title,
        description=payload.description,
        event_type=payload.event_type,
        start_date=payload.start_date,
        end_date=payload.end_date,
        rewards=payload.rewards,
        requirements=payload.requirements or {},
        image_url=payload.image_url,
        priority=payload.priority,
        is_active=True,
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev


@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: int = Path(..., ge=1),
    payload: EventUpdate = Body(...),
    admin_user: _AdminUser = Depends(require_admin_access),
    db = Depends(get_db),
):
    ev: Event = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(ev, field, value)
    db.commit()
    db.refresh(ev)
    return ev


@router.delete("/{event_id}", status_code=204)
def delete_event(
    event_id: int = Path(..., ge=1),
    admin_user: _AdminUser = Depends(require_admin_access),
    db = Depends(get_db),
):
    ev: Event = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(ev)
    db.commit()
    return None


class PublishRequest(BaseModel):
    is_active: bool = True


@router.post("/{event_id}/publish", response_model=EventResponse)
def publish_event(
    event_id: int = Path(..., ge=1),
    payload: PublishRequest = Body(default=PublishRequest()),
    admin_user: _AdminUser = Depends(require_admin_access),
    db = Depends(get_db),
):
    ev: Event = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    ev.is_active = payload.is_active
    db.commit()
    db.refresh(ev)
    return ev
