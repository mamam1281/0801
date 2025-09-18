"""Admin Events 관리 라우터

주의:
- 기존 events.py 공개 사용자 라우터와 목적 중복 없이 관리자 전용 기능만 제공
- settings import 표준 준수(app.core.config.settings 사용 금지 영역 아님 필요시) → 현재 필요 없음
- Alembic 마이그레이션 불필요: 기존 events/event_participations 테이블 활용
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Header
import json
import logging
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from ..database import get_db
from ..dependencies import get_current_user
from ..models.auth_models import User
from ..models.event_models import Event, EventParticipation, AdminEventForceClaimLog
from ..services.event_service import EventService
from ..schemas.event_schemas import EventCreate, EventUpdate, EventResponse, EventParticipationResponse, ClaimRewardResponse

router = APIRouter(prefix="/api/admin/events", tags=["Admin Events"],)

def require_admin(user: User = Depends(get_current_user)) -> User:
	if not user or not getattr(user, "is_admin", False):
		raise HTTPException(status_code=403, detail="관리자 권한 필요")
	return user

# --- 서비스 레벨 헬퍼 추가 (기존 EventService 확장 없을 경우 이곳 임시) ---
def _create_event(db: Session, data: EventCreate) -> Event:
	event = Event(
		title=data.title,
		description=data.description,
		event_type=data.event_type,
		start_date=data.start_date,
		end_date=data.end_date,
		rewards=data.rewards,
		requirements=data.requirements,
		image_url=data.image_url,
		priority=data.priority,
		is_active=True,
	)
	db.add(event)
	db.commit()
	db.refresh(event)
	return event

def _update_event(db: Session, event_id: int, data: EventUpdate) -> Event:
	event = db.query(Event).filter(Event.id == event_id).first()
	if not event:
		raise HTTPException(status_code=404, detail="이벤트 없음")
	for field, value in data.model_dump(exclude_unset=True).items():
		setattr(event, field, value)
	db.commit()
	db.refresh(event)
	return event

@router.post("/", response_model=EventResponse)
def create_event(payload: EventCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
	if payload.start_date >= payload.end_date:
		raise HTTPException(status_code=400, detail="종료일이 시작일보다 앞설 수 없음")
	return _create_event(db, payload)

@router.get("/", response_model=List[EventResponse])
def list_events(include_inactive: bool = Query(False), db: Session = Depends(get_db), _: User = Depends(require_admin)):
	q = db.query(Event)
	if not include_inactive:
		q = q.filter(Event.is_active == True)
	return q.order_by(Event.priority.desc(), Event.start_date.desc()).all()

@router.put("/{event_id}", response_model=EventResponse)
def update_event(event_id: int, payload: EventUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
	return _update_event(db, event_id, payload)

@router.post("/{event_id}/deactivate", response_model=EventResponse)
def deactivate_event(event_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
	event = db.query(Event).filter(Event.id == event_id).first()
	if not event:
		raise HTTPException(status_code=404, detail="이벤트 없음")
	event.is_active = False  # type: ignore[assignment]
	db.commit()
	db.refresh(event)
	return event

@router.get("/{event_id}/participations", response_model=List[EventParticipationResponse])
def list_participations(
	event_id: int,
	completed: Optional[bool] = Query(None),
	claimed: Optional[bool] = Query(None),
	db: Session = Depends(get_db),
	_: User = Depends(require_admin)
):
	q = db.query(EventParticipation).filter(EventParticipation.event_id == event_id)
	if completed is not None:
		q = q.filter(EventParticipation.completed == completed)
	if claimed is not None:
		q = q.filter(EventParticipation.claimed_rewards == claimed)
	return q.order_by(EventParticipation.id.desc()).all()

@router.post("/{event_id}/force-claim/{user_id}", response_model=ClaimRewardResponse)
def force_claim(
	event_id: int,
	user_id: int,
	db: Session = Depends(get_db),
	admin: User = Depends(require_admin),
	x_idempotency_key: str | None = Header(default=None, alias="X-Idempotency-Key"),
):
	"""이벤트 강제 보상 멱등 + 감사 로깅.

	흐름:
	  1. Idempotency 키 필수 (없으면 400)
	  2. 기존 로그 (키) 존재 → 참여 상태 확인 후 기존 결과 재구성 반환
	  3. 참여 레코드 조회/검증
	  4. 이미 claimed_rewards=True && 로그 없음 → "이미 보상 수령" 반환 (이전 수령)
	  5. 트랜잭션 내 보상 지급 + participation.claimed_rewards 세팅 + 로그 INSERT
	  6. 커밋 후 응답

	멱등 규칙:
	  - 동일 X-Idempotency-Key 재요청은 추가 변경 없이 최초 지급 결과(보상 스냅샷) 회수
	  - 다른 키로 반복 호출 시 이미 수령 상태면 빈 rewards + 메시지
	"""
	if not x_idempotency_key or len(x_idempotency_key) < 8:
		raise HTTPException(status_code=400, detail="유효한 X-Idempotency-Key 필요 (min length 8)")

	# 1) 기존 로그 조회 (멱등 재사용)
	existing_log: AdminEventForceClaimLog | None = (
		db.query(AdminEventForceClaimLog)
		.filter(AdminEventForceClaimLog.idempotency_key == x_idempotency_key)
		.first()
	)
	if existing_log:
		# 참여 레코드 현재 상태와 상관 없이 최초 지급 시점 스냅샷 반환
		logging.getLogger(__name__).info(
			"admin_force_claim_idempotent_replay",
			extra={
				"event_id": existing_log.event_id,
				"user_id": existing_log.target_user_id,
				"replayed": True,
			},
		)
		raw = existing_log.rewards
		if not isinstance(raw, dict):  # SQLAlchemy JSONB Column proxy 대응
			try:
				raw = json.loads(raw) if isinstance(raw, (str, bytes)) else {}
			except Exception:
				raw = {}
		return ClaimRewardResponse(
			success=True,
			rewards=raw or {},
			message="강제 지급 결과(멱등) 재사용",
		)

	# 2) 참여 레코드 확인
	participation = db.query(EventParticipation).filter(
		EventParticipation.event_id == event_id,
		EventParticipation.user_id == user_id,
	).first()
	if not participation:
		raise HTTPException(status_code=404, detail="참여 기록 없음")

	already_claimed = bool(getattr(participation, "claimed_rewards"))
	event = participation.event
	raw_rewards = event.rewards or {}
	rewards = dict(raw_rewards) if isinstance(raw_rewards, dict) else {}

	# 3) 이미 수령된 상태에서 새로운 키로 재시도 → 빈 rewards 안내
	if already_claimed:
		logging.getLogger(__name__).info(
			"admin_force_claim_already_claimed",
			extra={
				"event_id": event_id,
				"user_id": user_id,
				"idempotency_key": x_idempotency_key,
			},
		)
	return ClaimRewardResponse(success=True, rewards={}, message="이미 보상 수령")

	# 4) 지급 수행 (단순화: EventService 재사용 없이 직접 처리)
	from ..models.auth_models import User as AuthUser  # 지연 import
	user = db.query(AuthUser).filter(AuthUser.id == user_id).with_for_update().first()
	if not user:
		raise HTTPException(status_code=404, detail="사용자 없음")

	if 'gold' in rewards:
		user.gold_balance += rewards['gold']
	if 'exp' in rewards:
		user.experience += rewards['exp']
	# SQLAlchemy Boolean 컬럼: 직접 bool 값 할당 (IDE 타입 경고 회피용 noqa 주석)
	participation.claimed_rewards = True  # type: ignore[assignment]

	log_row = AdminEventForceClaimLog(
		idempotency_key=x_idempotency_key,
		admin_user_id=admin.id,
		target_user_id=user_id,
		event_id=event_id,
		rewards=rewards,
		completed_before=participation.completed,
	)
	db.add(log_row)
	try:
		db.commit()
	except Exception as e:  # UNIQUE 위반 등
		db.rollback()
		# 경쟁 상태에서 다른 트랜잭션이 동일 키 선점 가능 → 재조회로 멱등 처리
		existing_post = (
			db.query(AdminEventForceClaimLog)
			.filter(AdminEventForceClaimLog.idempotency_key == x_idempotency_key)
			.first()
		)
		if existing_post:
			raw2 = existing_post.rewards
			if not isinstance(raw2, dict):
				try:
					raw2 = json.loads(raw2) if isinstance(raw2, (str, bytes)) else {}
				except Exception:
					raw2 = {}
			return ClaimRewardResponse(
				success=True,
				rewards=raw2 or {},
				message="강제 지급 결과(경쟁 멱등) 재사용",
			)
		raise HTTPException(status_code=500, detail=f"강제 지급 실패: {e}")

	logging.getLogger(__name__).info(
		"admin_force_claim_granted",
		extra={
			"event_id": event_id,
			"user_id": user_id,
			"rewards": rewards,
			"completed": participation.completed,
			"claimed_previously": False,
			"idempotency_key": x_idempotency_key,
		},
	)
	return ClaimRewardResponse(success=True, rewards=rewards, message="강제 지급 완료")

@router.post("/seed/model-index", response_model=EventResponse)
def seed_model_index_event(db: Session = Depends(get_db), _: User = Depends(require_admin)):
	# 이미 존재하는지(타이틀 + active 기간 겹침) 확인
	title = "모델 지민 도전 이벤트"
	existing = db.query(Event).filter(Event.title == title).first()
	if existing:
		return existing
	now = datetime.utcnow()
	payload = EventCreate(
		title=title,
		description="모델 지민 포인트를 모아 보상을 획득하세요!",
		event_type="special",
		start_date=now - timedelta(minutes=1),
		end_date=now + timedelta(days=14),
		rewards={"gold": 5000, "exp": 1000},
		requirements={"model_index_points": 1000},
		image_url=None,
		priority=50,
	)
	return _create_event(db, payload)

