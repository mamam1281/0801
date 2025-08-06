"""Game Collection API Endpoints"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from ..database import get_db
from ..dependencies import get_current_user
from ..services.game_service import GameService

logger = logging.getLogger(__name__)

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

class GameResponse(BaseModel):
    """게임 목록 응답 모델"""
    id: int
    name: str
    type: str
    description: str
    min_bet: int
    max_bet: int
    is_active: bool

# Dependency injection
def get_game_service() -> GameService:
    """Game service dependency"""
    return GameService()

# API endpoints
@router.get("/", response_model=List[GameResponse])
async def get_games(db: Session = Depends(get_db)):
    """게임 목록 조회"""
    logger.info("API: GET /api/games - 게임 목록 조회")
    # 하드코딩된 게임 목록 반환 (DB 모델이 없는 경우)
    games = [
        {
            "id": 1,
            "name": "Neon Slots",
            "type": "slot",
            "description": "네온 테마 슬롯머신",
            "min_bet": 100,
            "max_bet": 10000,
            "is_active": True
        },
        {
            "id": 2,
            "name": "Neon Crash",
            "type": "crash",
            "description": "네온 크래시 게임",
            "min_bet": 50,
            "max_bet": 5000,
            "is_active": True
        }
    ]
    return games

@router.post("/slot/spin", response_model=Dict[str, Any])
async def slot_spin(
    request: SlotSpinRequest,
    current_user = Depends(get_current_user),
    db = Depends(get_db),
    game_service: GameService = Depends(get_game_service)
):
    """슬롯머신 스핀"""
    logger.info(f"API: POST /api/games/slot/spin - user_id={current_user.id}, bet_amount={request.bet_amount}")
    # 간단한 슬롯 로직 구현
    import random
    
    # 잔액 확인
    if current_user.coin_balance < request.bet_amount:
        raise HTTPException(status_code=400, detail="잔액이 부족합니다")
    
    # 슬롯 결과 생성
    symbols = ["🍒", "🍋", "🍊", "🍇", "💎", "7️⃣"]
    reels = [[random.choice(symbols) for _ in range(3)] for _ in range(3)]
    
    # 승리 판정 (간단한 로직)
    win_amount = 0
    if reels[1][0] == reels[1][1] == reels[1][2]:  # 중간 줄 일치
        win_amount = request.bet_amount * 10
    
    # 잔액 업데이트
    current_user.coin_balance -= request.bet_amount
    current_user.coin_balance += win_amount
    db.commit()
    
    return {
        "reels": reels,
        "win_amount": win_amount,
        "balance": current_user.coin_balance,
        "is_jackpot": win_amount > request.bet_amount * 50
    }

@router.post("/prize-roulette/spin", response_model=PrizeRouletteSpinResponse)
async def prize_roulette_spin(
    current_user = Depends(get_current_user),
    db = Depends(get_db),
    game_service: GameService = Depends(get_game_service)
):
    """Prize roulette spin"""
    logger.info(f"API: POST /api/games/prize-roulette/spin - user_id={current_user.id}")
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
