"""
PrizeRoulette �KOREAN_TEXT_REMOVED API KOREAN_TEXT_REMOVED

KOREAN_TEXT_REMOVED PrizeRoulette.tsx �KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED 
KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED
1. GET /api/roulette/info - KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED
2. POST /api/roulette/spin - �KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED
"""
from fastapi import APIRouter, Depends, HTTPException, status

from typing import Dict, Any, Optional
import random
import uuid
from datetime import datetime, time, timedelta
import logging
from fastapi.security import OAuth2PasswordBearer

from app.database import get_db
from app.models import User
from app.dependencies import get_current_user
from app.schemas.game_schemas import RouletteInfoResponse, RouletteSpinRequest, RouletteSpinResponse
from app.services.roulette_service import RouletteService

# �KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/roulette",
    tags=["roulette"],
    responses={404: {"description": "Not found"}},
)

# KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED
# KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED
def get_roulette_service(db = Depends(get_db)):
    from app.repositories.game_repository import GameRepository
    repo = GameRepository(db)
    return RouletteService(repo)

@router.get("/info", response_model=RouletteInfoResponse)
async def get_roulette_info(
    db = Depends(get_db),
    current_user: User = Depends(get_current_user),
    roulette_service: RouletteService = Depends(get_roulette_service)
):
    """
    KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED
    - KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED
    - KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED (KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED)
    - �KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED
    """
    try:
        # KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED
        user_id = current_user.id
        
        # KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED (�KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED 3KOREAN_TEXT_REMOVED
        daily_limit = 3
        spins_used_today = 0  # KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED DBKOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED
        spins_left = max(0, daily_limit - spins_used_today)
        
        # KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED 가KOREAN_TEXT_REMOVED (쿨�KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED
        next_spin_time = None
        if spins_left == 0:
            # KOREAN_TEXT_REMOVED리�KOREAN_TEXT_REMOVED
            from datetime import datetime, time
            tomorrow = datetime.now().date() + timedelta(days=1)
            next_spin_time = datetime.combine(tomorrow, time.min)
        
        return RouletteInfoResponse(
            spins_left=spins_left,
            next_spin_time=next_spin_time,
            daily_spins_used=spins_used_today,
            total_spins_today=daily_limit
        )
    except Exception as e:
        logger.error(f"�KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="�KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED가 �KOREAN_TEXT_REMOVED."
        )


@router.post("/spin", response_model=RouletteSpinResponse)
async def spin_roulette(
    request: Optional[RouletteSpinRequest] = None,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user),
    roulette_service: RouletteService = Depends(get_roulette_service)
):
    """
    KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED���KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED
    - KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED (KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED)
    - KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED(KOREAN_TEXT_REMOVED, KOREAN_TEXT_REMOVED, KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED)
    - �KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED지
    - KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED
    """
    try:
        user_id = current_user.id
        
        # KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED 가KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED
        daily_limit = 3
        spins_used_today = 0  # KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED DBKOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED
        spins_left = max(0, daily_limit - spins_used_today)
        
        if spins_left <= 0:
            return RouletteSpinResponse(
                success=False,
                message="KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED모�KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED. KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED!",
                spins_left=0,
                cooldown_expires=datetime.now() + timedelta(hours=24)
            )
        
        # �KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED
        prizes = [
            {"id": "coin_50", "name": "50 Coins", "probability": 30, "type": "normal"},
            {"id": "coin_100", "name": "100 Coins", "probability": 25, "type": "normal"},
            {"id": "coin_200", "name": "200 Coins", "probability": 20, "type": "normal"},
            {"id": "gem_5", "name": "5 Gems", "probability": 15, "type": "rare"},
            {"id": "gem_10", "name": "10 Gems", "probability": 8, "type": "rare"},
            {"id": "jackpot", "name": "Jackpot! 1000 Coins", "probability": 2, "type": "jackpot"}
        ]
        
        # KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED
        rand = random.randint(1, 100)
        cumulative = 0
        selected_prize = prizes[0]  # �KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED
        
        for prize in prizes:
            cumulative += prize["probability"]
            if rand <= cumulative:
                selected_prize = prize
                break
        
        # �KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED지 KOREAN_TEXT_REMOVED
        message = f"KOREAN_TEXT_REMOVED {selected_prize['name']}KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED!"
        animation_type = selected_prize["type"]
        
        if selected_prize["type"] == "jackpot":
            message = f"KOREAN_TEXT_REMOVED JACKPOT! {selected_prize['name']}KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED!"
        
        # KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED
        remaining_spins = spins_left - 1
        
        return RouletteSpinResponse(
            success=True,
            result=selected_prize["id"],
            message=message,
            spins_left=remaining_spins,
            animation_type=animation_type,
            prize_name=selected_prize["name"]
        )
    except Exception as e:
        logger.error(f"�KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED�� KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="�KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED�� �KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED가 �KOREAN_TEXT_REMOVED."
        )


# 관리�KOREAN_TEXT_REMOVEDAPI
@router.get("/admin/stats", response_model=Dict[str, Any])
async def get_roulette_admin_stats(
    db = Depends(get_db),
    current_user: User = Depends(get_current_user),
    roulette_service: RouletteService = Depends(get_roulette_service)
):
    """
    KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED 관리�KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED
    - KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED
    - KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED
    - KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리�KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED."
        )
    
    try:
        # KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED (KOREAN_TEXT_REMOVED모�KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED
        today = datetime.now().date()
        
        # 모�KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED
        stats = {
            "today_stats": {
                "daily_spins": random.randint(50, 200),
                "active_users": random.randint(15, 50),
                "total_prizes_given": random.randint(100, 400),
                "jackpot_count": random.randint(0, 3)
            },
            "prize_distribution": {
                "coin_50": random.randint(20, 80),
                "coin_100": random.randint(15, 60),
                "coin_200": random.randint(10, 40),
                "gem_5": random.randint(5, 25),
                "gem_10": random.randint(2, 15),
                "jackpot": random.randint(0, 3)
            },
            "user_engagement": {
                "total_registered_users": random.randint(500, 1500),
                "daily_active_users": random.randint(50, 200),
                "retention_rate": round(random.uniform(0.3, 0.8), 2)
            },
            "revenue_metrics": {
                "coins_distributed": random.randint(10000, 50000),
                "gems_distributed": random.randint(500, 2000),
                "premium_conversions": random.randint(5, 25)
            }
        }
        
        return stats
    except Exception as e:
        logger.error(f"관리�KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="관리�KOREAN_TEXT_REMOVED KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED�KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED �KOREAN_TEXT_REMOVED��KOREAN_TEXT_REMOVED가 �KOREAN_TEXT_REMOVED."
        )
