from fastapi import APIRouter, Depends


from ..services.dashboard_service import DashboardService
from ..database import get_db
from ..services.auth_service import AuthService # For admin protection
from .. import models

router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard", "admin"],
    # dependencies=[Depends(AuthService.get_current_admin)] # Protect all dashboard routes
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
