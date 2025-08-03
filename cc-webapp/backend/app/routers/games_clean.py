"""Game Collection API Endpoints"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from ..database import get_db
from ..dependencies import get_current_user
from ..services.game_service import GameService

router = APIRouter(prefix="/api/games", tags=["games"])

# Pydantic models
class PrizeRouletteSpinRequest(BaseModel):
    """Prize roulette spin request"""
    pass  # Simple spin only, no additional parameters

class GachaPullRequest(BaseModel):
    count: int  # Number of pulls

class RPSPlayRequest(BaseModel):
    choice: str  # "rock", "paper", "scissors"
    bet_amount: int

class SlotSpinRequest(BaseModel):
    """Slot machine spin request"""
    bet_amount: int

class PrizeRouletteSpinResponse(BaseModel):
    """Prize roulette spin response"""
    winner_prize: str
    tokens_change: int
    balance: int

class PrizeRouletteInfoResponse(BaseModel):
    """Prize roulette info response"""
    prizes: List[Dict[str, Any]]
    max_daily_spins: int

class GachaPullResponse(BaseModel):
    """Gacha pull response"""
    results: List[str]  # Actual GachaPullResult format
    tokens_change: int
    balance: int

class RPSPlayResponse(BaseModel):
    """Rock Paper Scissors response"""
    user_choice: str
    computer_choice: str
    result: str
    tokens_change: int
    balance: int

# Dependency injection
def get_game_service() -> GameService:
    """Game service dependency"""
    return GameService()

# API endpoints
@router.post("/slot/spin", response_model=Dict[str, Any])
async def slot_spin(
    current_user = Depends(get_current_user),
    db = Depends(get_db),
    game_service: GameService = Depends(get_game_service)
):
    """Slot machine spin"""
    try:
        result = game_service.slot_spin(current_user.id, db)
        return {
            "success": True,
            "message": "Slot spin completed",
            "result": result,
            "user_id": current_user.id
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Slot spin failed")

@router.post("/prize-roulette/spin", response_model=PrizeRouletteSpinResponse)
async def prize_roulette_spin(
    current_user = Depends(get_current_user),
    db = Depends(get_db),
    game_service: GameService = Depends(get_game_service)
):
    """Prize roulette spin"""
    try:
        result = game_service.prize_roulette_spin(current_user.id, db)
        
        return PrizeRouletteSpinResponse(
            winner_prize=getattr(result, 'winner_prize', 'Unknown'),
            tokens_change=getattr(result, 'tokens_change', 0),
            balance=getattr(result, 'balance', 0)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Prize roulette spin failed")

@router.get("/prize-roulette/info", response_model=PrizeRouletteInfoResponse)
async def get_prize_roulette_info(
    current_user = Depends(get_current_user),
    db = Depends(get_db),
    game_service: GameService = Depends(get_game_service)
):
    """Get prize roulette information"""
    try:
        info = game_service.get_prize_roulette_info(current_user.id, db)
        return PrizeRouletteInfoResponse(
            prizes=getattr(info, 'prizes', []),
            max_daily_spins=getattr(info, 'max_daily_spins', 5)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get prize roulette info")

@router.post("/gacha/pull", response_model=GachaPullResponse)
async def gacha_pull(
    request: GachaPullRequest,
    current_user = Depends(get_current_user),
    db = Depends(get_db),
    game_service: GameService = Depends(get_game_service)
):
    """Gacha pull"""
    try:
        result = game_service.gacha_pull(current_user.id, request.count, db)
        
        return GachaPullResponse(
            results=getattr(result, 'results', []),
            tokens_change=getattr(result, 'tokens_change', 0),
            balance=getattr(result, 'balance', 0)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Gacha pull failed")

@router.post("/rps/play", response_model=RPSPlayResponse)
async def rps_play(
    request: RPSPlayRequest,
    current_user = Depends(get_current_user),
    db = Depends(get_db),
    game_service: GameService = Depends(get_game_service)
):
    """Rock Paper Scissors play"""
    try:
        result = game_service.rps_play(current_user.id, request.choice, request.bet_amount, db)
        
        return RPSPlayResponse(
            user_choice=getattr(result, 'user_choice', request.choice),
            computer_choice=getattr(result, 'computer_choice', 'rock'),
            result=getattr(result, 'result', 'tie'),
            tokens_change=getattr(result, 'tokens_change', 0),
            balance=getattr(result, 'balance', 0)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="RPS play failed")
