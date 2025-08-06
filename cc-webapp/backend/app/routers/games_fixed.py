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
from ..models.game_models import Game, UserAction
from ..services.simple_user_service import SimpleUserService
from ..schemas.game_schemas import (
    GameListResponse, GameDetailResponse,
    GameSessionStart, GameSessionEnd,
    SlotSpinRequest, SlotSpinResponse,
    RPSPlayRequest, RPSPlayResponse,
    GachaPullRequest, GachaPullResponse,
    CrashBetRequest, CrashBetResponse
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/games", tags=["Games"])

@router.get("/", response_model=List[GameListResponse])
async def get_games_list(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    게임 목록 조회
    """
    games = db.query(Game).filter(Game.is_active == True).all()
    result = []
    
    for game in games:
        # 모든 필수 필드가 있는 딕셔너리 생성
        game_dict = {
            "id": str(game.id),
            "name": game.name,
            "description": game.description,
            "type": game.game_type,
            "image_url": getattr(game, 'image_url', f"/assets/games/{game.game_type}.png"),
            "is_active": game.is_active,
            "daily_limit": None,
            "playCount": 0,
            "bestScore": 0,
            "canPlay": True,
            "cooldown_remaining": None,
            "requires_vip_tier": None
        }
        # GameListResponse 모델에 전달
        game_response = GameListResponse(**game_dict)
        result.append(game_response)
    
    return result

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
    bet_amount = request.bet_amount
    
    # 잔액 확인 (토큰 잔액)
    current_tokens = SimpleUserService.get_user_tokens(db, current_user.id)
    if current_tokens < bet_amount:
        raise HTTPException(status_code=400, detail="토큰이 부족합니다")
    
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
    new_balance = SimpleUserService.update_user_tokens(db, current_user.id, -bet_amount + win_amount)
    
    # 플레이 기록 저장
    action_data = {
        "game_type": "slot",
        "bet_amount": bet_amount,
        "win_amount": win_amount,
        "reels": reels,
        "is_jackpot": reels[0] == '7️⃣' and reels[0] == reels[1] == reels[2]
    }
    
    user_action = UserAction(
        user_id=current_user.id,
        action_type="SLOT_SPIN",
        action_data=str(action_data)
    )
    db.add(user_action)
    db.commit()
    
    # SlotSpinResponse 객체 생성 (이중 리스트로 reels 설정)
    return SlotSpinResponse(
        success=True,
        reels=[reels],  # 이중 리스트로 감싸기
        win_amount=win_amount,
        win_lines=[],
        multiplier=1.0,
        is_jackpot=reels[0] == '7️⃣' and reels[0] == reels[1] == reels[2],
        free_spins_awarded=0,
        message='슬롯 게임 결과입니다.',
        balance=new_balance
    )

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
    user_choice = request.choice
    bet_amount = request.bet_amount
    
    # 잔액 확인
    current_tokens = SimpleUserService.get_user_tokens(db, current_user.id)
    if current_tokens < bet_amount:
        raise HTTPException(status_code=400, detail="토큰이 부족합니다")
    
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
    new_balance = SimpleUserService.update_user_tokens(db, current_user.id, -bet_amount + win_amount)
    
    # 플레이 기록 저장
    action_data = {
        "game_type": "rps",
        "bet_amount": bet_amount,
        "win_amount": win_amount,
        "user_choice": user_choice,
        "ai_choice": ai_choice,
        "result": result
    }
    
    user_action = UserAction(
        user_id=current_user.id,
        action_type="RPS_PLAY",
        action_data=str(action_data)
    )
    db.add(user_action)
    db.commit()
    
    return RPSPlayResponse(
        success=True,
        player_choice=user_choice,
        computer_choice=ai_choice,
        result=result,
        win_amount=win_amount,
        message=f'결과: {result}',
        balance=new_balance,
        streak=1
    )

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
    pull_count = request.pull_count
    cost_per_pull = 300
    total_cost = cost_per_pull * pull_count
    
    # 잔액 확인
    current_tokens = SimpleUserService.get_user_tokens(db, current_user.id)
    if current_tokens < total_cost:
        raise HTTPException(status_code=400, detail="토큰이 부족합니다")
    
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
    new_balance = SimpleUserService.update_user_tokens(db, current_user.id, -total_cost)
    
    # 플레이 기록 저장
    action_data = {
        "game_type": "gacha",
        "cost": total_cost,
        "pull_count": pull_count,
        "items": items
    }
    
    user_action = UserAction(
        user_id=current_user.id,
        action_type="GACHA_PULL",
        action_data=str(action_data)
    )
    db.add(user_action)
    db.commit()
    
    return GachaPullResponse(
        success=True,
        items=items,
        rare_item_count=sum(1 for item in items if item['rarity'] == 'rare'),
        ultra_rare_item_count=sum(1 for item in items if item['rarity'] in ['epic', 'legendary']),
        message='가챠 뽑기 결과입니다.',
        currency_balance={'cyber_token': new_balance}
    )

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
    bet_amount = request.bet_amount
    auto_cashout_multiplier = request.auto_cashout_multiplier
    
    # 잔액 확인
    current_tokens = SimpleUserService.get_user_tokens(db, current_user.id)
    if current_tokens < bet_amount:
        raise HTTPException(status_code=400, detail="토큰이 부족합니다")
    
    # 게임 ID 생성
    import uuid
    game_id = str(uuid.uuid4())
    
    # 잔액 차감
    new_balance = SimpleUserService.update_user_tokens(db, current_user.id, -bet_amount)
    
    # 간단한 크래시 시뮬레이션
    # 실제로는 실시간 소켓 연결로 구현해야 함
    multiplier = random.uniform(1.0, 5.0)
    win_amount = 0
    
    # 자동 캐시아웃 시뮬레이션
    if auto_cashout_multiplier and multiplier >= auto_cashout_multiplier:
        win_amount = int(bet_amount * auto_cashout_multiplier)
        new_balance = SimpleUserService.update_user_tokens(db, current_user.id, win_amount)
    
    # 플레이 기록 저장
    action_data = {
        "game_type": "crash",
        "bet_amount": bet_amount,
        "game_id": game_id,
        "auto_cashout": auto_cashout_multiplier,
        "actual_multiplier": multiplier,
        "win_amount": win_amount
    }
    
    user_action = UserAction(
        user_id=current_user.id,
        action_type="CRASH_BET",
        action_data=str(action_data)
    )
    db.add(user_action)
    db.commit()
    
    return CrashBetResponse(
        success=True,
        game_id=game_id,
        bet_amount=bet_amount,
        potential_win=int(bet_amount * multiplier) if win_amount == 0 else win_amount,
        max_multiplier=round(multiplier, 2),
        message='크래시 게임 베팅이 완료되었습니다.',
        balance=new_balance
    )
