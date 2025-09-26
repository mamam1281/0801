"""
레거시 MissionService 어댑터
---------------------------------
현행 미션/이벤트 모델 구조(event_service.MissionService)에 맞춰 동작하도록
기존 services/mission_service.py를 얇은 위임 어댑터로 대체한다.

주의: 이 모듈은 FastAPI 라우터(app/routers/missions.py)의 기대 시그니처를 만족하기 위해
list_user_missions/claim_reward 메서드만 제공한다. 내부 로직은
app.services.event_service.MissionService로 위임된다.
"""

from typing import Any, Dict, List
from sqlalchemy.orm import Session

from .event_service import MissionService as CoreMissionService


class MissionService:
    def __init__(self, db: Session):
        self.db = db

    def list_user_missions(self, user_id: int) -> List[Dict[str, Any]]:
        """사용자 미션 목록(현행 스키마 기반) 반환: 직렬화된 dict 리스트.

        기존 레거시 스키마의 키명(target_count/current_count 등)과는 다르며,
        현행 모델(Mission/UserMission)의 필드에 맞춰 노출한다.
        """
        items = CoreMissionService.get_user_missions(self.db, user_id, mission_type=None)
        results: List[Dict[str, Any]] = []
        for um in items:
            m = getattr(um, "mission", None)
            results.append(
                {
                    "mission_id": getattr(m, "id", None),
                    "title": getattr(m, "title", None),
                    "description": getattr(m, "description", None),
                    "target_value": getattr(m, "target_value", None),
                    "rewards": getattr(m, "rewards", {}) or {},
                    "current_progress": getattr(um, "current_progress", 0) or 0,
                    "completed": bool(getattr(um, "completed", False)),
                    "claimed": bool(getattr(um, "claimed", False)),
                }
            )
        return results

    def claim_reward(self, user_id: int, mission_id: int) -> Any:
        """미션 보상 수령(현행 event_service에 위임).

        라우터 호환을 위해 id 속성을 가진 얕은 스텁 객체를 반환한다.
        실제 보상/잔액 갱신은 app.services.event_service.MissionService.claim_mission_rewards에서 처리.
        """
        ctx = CoreMissionService.claim_mission_rewards(self.db, user_id=user_id, mission_id=mission_id)

        class _UserRewardStub:
            def __init__(self, id: int | None = None, context: Dict[str, Any] | None = None):
                self.id = id
                self.context = context

        return _UserRewardStub(id=None, context=ctx)
