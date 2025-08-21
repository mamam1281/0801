from fastapi import APIRouter, Depends
from fastapi import HTTPException
from typing import Any, Dict

from ..services.dashboard_service import DashboardService
from ..database import get_db
from ..services.auth_service import AuthService  # For admin protection (optional future)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)

@router.get("/main")
def get_main_dashboard(db = Depends(get_db)):
    """
    Get main dashboard statistics.
    """
    dashboard_service = DashboardService(db)
    return dashboard_service.get_main_dashboard_stats()

@router.get("/games")
def get_games_dashboard(db = Depends(get_db)):
    """
    Get game-specific dashboard statistics.
    """
    dashboard_service = DashboardService(db)
    return dashboard_service.get_game_dashboard_stats()

@router.get("/social-proof")
def get_social_proof(db = Depends(get_db)):
    """
    Get statistics for social proof widgets.
    This endpoint is not protected by admin auth to be publicly available.
    """
    dashboard_service = DashboardService(db)
    return dashboard_service.get_social_proof_stats()


@router.get("", summary="Unified dashboard aggregate")
def get_unified_dashboard(db = Depends(get_db)) -> Dict[str, Any]:
    """통합 대시보드 집계 엔드포인트

    기존 개별 엔드포인트(/dashboard/main, /dashboard/games, /dashboard/social-proof)를 한 번에 호출해
    프론트 초기 로딩 RTT를 줄이고 일관된 스냅샷을 제공한다.

    Response 예시:
    {
      "main": {...},
      "games": {...},
      "social_proof": {...},
      "_meta": {"generated_at": "2025-08-21T12:34:56Z"}
    }
    """
    service = DashboardService(db)
    try:
        main_stats = service.get_main_dashboard_stats()
        game_stats = service.get_game_dashboard_stats()
        social = service.get_social_proof_stats()
    except Exception as e:  # 방어적 처리, 부분 실패 시 500
        raise HTTPException(status_code=500, detail=f"dashboard aggregation failed: {e}")
    from datetime import datetime, timezone
    return {
        "main": main_stats,
        "games": game_stats,
        "social_proof": social,
        "_meta": {"generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")}
    }
