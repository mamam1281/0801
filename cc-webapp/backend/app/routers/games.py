"""Game Collection API Endpoints"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import random
from typing import List, Optional, Dict, Any
from datetime import datetime

from ..database import get_db
from ..dependencies import get_current_user
from ..models.auth_models import User
from ..models.game_models import GameSession, GameStats
from ..schemas.game_schemas import (
    GameListResponse, GameDetailResponse, 
    GameSessionStart, GameSessionEnd,
    SlotSpinRequest, SlotSpinResponse,
    RPSPlayRequest, RPSPlayResponse,
    GachaPullRequest, GachaPullResponse,
    CrashBetRequest, CrashBetResponse
)
from ..services.game_service import GameService
from ..services.reward_service import RewardService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/games", tags=["Games"])

@router.get("/", response_model=List[GameListResponse])
async def get_games_list(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    사용자별 맞춤 게임 목록 조회
    - 각 게임의 플레이 가능 상태
    - 사용자의 게임별 최고 기록
    - 일일 제한 상태
    """
    games = GameService.get_user_games_list(db, current_user.id)
    
    # 사용자별 게임 통계 추가
    for game in games:
        stats = GameService.get_user_game_stats(
            db, current_user.id, game['type']
        )
        game.update({
            'playCount': stats.get('totalGames', 0),
            'bestScore': stats.get('bestScore', 0),
            'canPlay': GameService.can_play_game(
                db, current_user, game['type']
            ),
            'remainingPlays': GameService.get_remaining_plays(
                db, current_user.id, game['type']
            )
        })
    
    return games

@router.get("/stats/{user_id}")
async def get_user_game_stats(
    user_id: int,
    game_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    사용자 게임 통계 조회
    """
    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="권한이 없습니다")
    
    stats = GameService.get_comprehensive_stats(db, user_id, game_type)
    return stats

@router.post("/session/start")
async def start_game_session(
    request: GameSessionStart,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    게임 세션 시작
    - 잔액 확인
    - 일일 제한 확인
    - 세션 생성
    """
    # 잔액 확인
    if not GameService.check_balance(db, current_user.id, request.betAmount):
        raise HTTPException(status_code=400, detail="잔액이 부족합니다")
    
    # 일일 제한 확인
    if not GameService.check_daily_limit(db, current_user.id, request.gameType):
        raise HTTPException(status_code=400, detail="일일 게임 제한을 초과했습니다")
    
    # 세션 생성
    session = GameService.create_game_session(
        db, current_user.id, request.gameType, request.betAmount
    )
    
    return {
        "sessionId": session.id,
        "gameType": session.game_type,
        "betAmount": session.bet_amount,
        "startTime": session.start_time
    }

# 슬롯 게임 엔드포인트
@router.post("/slot/spin", response_model=SlotSpinResponse)
async def spin_slot(
    request: SlotSpinRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    슬롯머신 스핀
    """
    bet_amount = request.get("betAmount", 100)
    
    # 잔액 확인
    if current_user.gold_balance < bet_amount:
        raise HTTPException(status_code=400, detail="잔액이 부족합니다")
    
    # 슬롯 결과 생성
    symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣']
    weights = [30, 25, 20, 15, 8, 2]
    
    reels = [random.choices(symbols, weights=weights)[0] for _ in range(3)]
    
    # 승리 판정
    win_amount = 0
    if reels[0] == reels[1] == reels[2]:
        multiplier = {'🍒': 2, '🍋': 3, '🍊': 4, '🍇': 5, '💎': 10, '7️⃣': 50}
        win_amount = bet_amount * multiplier.get(reels[0], 1)
    elif reels[0] == reels[1] or reels[1] == reels[2]:
        win_amount = int(bet_amount * 1.5)
    
    # 잔액 업데이트
    current_user.gold_balance = current_user.gold_balance - bet_amount + win_amount
    
    # 통계 업데이트
    if not hasattr(current_user, 'game_stats'):
        current_user.game_stats = {}
    if 'slot' not in current_user.game_stats:
        current_user.game_stats['slot'] = {
            'totalSpins': 0,
            'totalWinnings': 0,
            'biggestWin': 0
        }
    
    current_user.game_stats['slot']['totalSpins'] += 1
    current_user.game_stats['slot']['totalWinnings'] += win_amount
    if win_amount > current_user.game_stats['slot']['biggestWin']:
        current_user.game_stats['slot']['biggestWin'] = win_amount
    
    db.commit()
    
    return {
        'reels': reels,
        'winAmount': win_amount,
        'isJackpot': reels[0] == '7️⃣' and reels[0] == reels[1] == reels[2],
        'newBalance': current_user.gold_balance
    }

# 가위바위보 엔드포인트
@router.post("/rps/play", response_model=RPSPlayResponse)
async def play_rps(
    request: RPSPlayRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    가위바위보 플레이
    """
    user_choice = request.get("choice")
    bet_amount = request.get("betAmount", 50)
    
    # 잔액 확인
    if current_user.gold_balance < bet_amount:
        raise HTTPException(status_code=400, detail="잔액이 부족합니다")
    
    # AI 선택
    choices = ['rock', 'paper', 'scissors']
    ai_choice = random.choice(choices)
    
    # 승부 판정
    result = 'draw'
    win_amount = 0
    
    if user_choice == ai_choice:
        result = 'draw'
        win_amount = bet_amount  # 무승부시 베팅금액 반환
    elif (
        (user_choice == 'rock' and ai_choice == 'scissors') or
        (user_choice == 'paper' and ai_choice == 'rock') or
        (user_choice == 'scissors' and ai_choice == 'paper')
    ):
        result = 'win'
        win_amount = bet_amount * 2
    else:
        result = 'lose'
        win_amount = 0
    
    # 잔액 업데이트
    current_user.gold_balance = current_user.gold_balance - bet_amount + win_amount
    db.commit()
    
    return {
        'userChoice': user_choice,
        'aiChoice': ai_choice,
        'result': result,
        'winAmount': win_amount,
        'newBalance': current_user.gold_balance
    }

# 가챠 엔드포인트
@router.post("/gacha/pull", response_model=GachaPullResponse)
async def pull_gacha(
    request: GachaPullRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    가챠 뽑기
    """
    pull_count = request.get("pullCount", 1)
    cost_per_pull = 500
    total_cost = cost_per_pull * pull_count
    
    # 잔액 확인
    if current_user.gold_balance < total_cost:
        raise HTTPException(status_code=400, detail="잔액이 부족합니다")
    
    # 가챠 아이템 생성
    rarities = ['common', 'rare', 'epic', 'legendary']
    weights = [60, 30, 9, 1]
    
    items = []
    for _ in range(pull_count):
        rarity = random.choices(rarities, weights=weights)[0]
        items.append({
            'name': f'{rarity.capitalize()} Item',
            'rarity': rarity,
            'value': {'common': 100, 'rare': 500, 'epic': 2000, 'legendary': 10000}[rarity]
        })
    
    # 잔액 업데이트
    current_user.gold_balance -= total_cost
    db.commit()
    
    return {
        'items': items,
        'totalValue': sum(item['value'] for item in items),
        'newBalance': current_user.gold_balance
    }

# 크래시 게임 엔드포인트
@router.post("/crash/bet", response_model=CrashBetResponse)
async def place_crash_bet(
    request: CrashBetRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    크래시 게임 베팅
    """
    bet_amount = request.get("betAmount", 200)
    auto_cashout = request.get("autoCashout")
    
    # 잔액 확인
    if current_user.gold_balance < bet_amount:
        raise HTTPException(status_code=400, detail="잔액이 부족합니다")
    
    # 게임 ID 생성
    import uuid
    game_id = str(uuid.uuid4())
    
    # 잔액 차감
    current_user.gold_balance -= bet_amount
    db.commit()
    
    return {
        'gameId': game_id,
        'betAmount': bet_amount,
        'autoCashout': auto_cashout,
        'newBalance': current_user.gold_balance
    }

@router.post("/crash/cashout")
async def cashout_crash(
    request: CrashBetRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    크래시 게임 캐시아웃
    """
    game_id = request.get("gameId")
    
    # 랜덤 배율 생성 (실제로는 게임 세션에서 관리해야 함)
    multiplier = random.uniform(1.0, 5.0)
    win_amount = int(200 * multiplier)  # 임시로 200 베팅 가정
    
    # 잔액 업데이트
    current_user.gold_balance += win_amount
    db.commit()
    
    return {
        'multiplier': round(multiplier, 2),
        'winAmount': win_amount,
        'newBalance': current_user.gold_balance
    }
