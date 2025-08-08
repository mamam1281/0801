"""Game Collection API Endpoints (Updated & Unified)"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
import random
import json
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

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
    CrashBetRequest, CrashBetResponse,
    GameStats, ProfileGameStats, Achievement, GameSession, GameLeaderboard
)
from app import models

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/games", tags=["Games"])

# ================= Existing Simple Game Feature Endpoints =================

@router.get("/")
async def get_games_list(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    게임 목록 조회 (직접 JSON 반환)
    """
    games = db.query(Game).filter(Game.is_active == True).all()
    result = []
    
    for game in games:
        # 직접 JSON 형식 준비
        game_data = {
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
        result.append(game_data)
    
    # 직접 JSON 반환
    return Response(content=json.dumps(result), media_type="application/json")

# 슬롯 게임 엔드포인트
@router.post("/slot/spin")
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
    
    return {
        'reels': reels,
        'win_amount': win_amount,
        'is_jackpot': reels[0] == '7️⃣' and reels[0] == reels[1] == reels[2],
        'balance': new_balance
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
    
    # Build response matching schema
    message_map = {
        'win': 'You win!',
        'lose': 'You lose!',
        'draw': 'It\'s a draw.'
    }
    return {
        'success': True,
        'player_choice': user_choice,
        'computer_choice': ai_choice,
        'result': result,
        'win_amount': win_amount,
        'message': message_map[result],
        'balance': new_balance,
        'streak': None,
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
    
    # Count rarities
    rare_count = sum(1 for it in items if it['rarity'] == 'rare')
    ultra_rare_count = sum(1 for it in items if it['rarity'] in ('epic', 'legendary'))

    return {
        'success': True,
        'items': items,
        'rare_item_count': rare_count,
        'ultra_rare_item_count': ultra_rare_count,
        'special_animation': None,
        'message': 'Gacha pull completed',
        'currency_balance': {
            'tokens': new_balance
        }
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
    
    potential_win = int(bet_amount * (auto_cashout_multiplier or multiplier))
    return {
        'success': True,
        'game_id': game_id,
        'bet_amount': bet_amount,
        'potential_win': potential_win,
        'max_multiplier': round(multiplier, 2),
        'message': 'Bet placed' if win_amount == 0 else 'Auto-cashout triggered',
        'balance': new_balance
    }

# -------------------------------------------------------------------------
# ================= Integrated Unified Game API (from game_api.py) =================
@router.get("/stats/{user_id}", response_model=GameStats)
def get_game_stats(user_id: int, db: Session = Depends(get_db)):
    """사용자 전체 게임 통계 (슬롯/룰렛/가챠 등)"""
    total_spins = db.query(models.UserAction).filter(
        models.UserAction.user_id == user_id,
        models.UserAction.action_type.in_(['SLOT_SPIN', 'ROULETTE_SPIN', 'GACHA_PULL'])
    ).count()

    # TODO: 보상 테이블 존재 여부 검증 후 reward 집계 로직 조정 필요
    total_coins_won = 0
    total_gems_won = 0
    special_items_won = 0
    jackpots_won = db.query(models.UserAction).filter(
        models.UserAction.user_id == user_id,
        models.UserAction.action_data.contains('jackpot')
    ).count()

    return GameStats(
        user_id=user_id,
        total_spins=total_spins,
        total_coins_won=total_coins_won,
        total_gems_won=total_gems_won,
        special_items_won=special_items_won,
        jackpots_won=jackpots_won,
        bonus_spins_won=0,
        best_streak=0,
        current_streak=calculate_user_streak(user_id, db),
        last_spin_date=None
    )

@router.get("/profile/{user_id}/stats", response_model=ProfileGameStats)
def get_profile_game_stats(user_id: int, db: Session = Depends(get_db)):
    """프로필용 상세 게임 통계"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    week_ago = datetime.now() - timedelta(days=7)
    recent_actions = db.query(models.UserAction).filter(
        models.UserAction.user_id == user_id,
        models.UserAction.created_at >= week_ago
    ).count()

    favorite_game_query = db.query(
        models.UserAction.action_type,
        db.func.count(models.UserAction.id).label('count')
    ).filter(
        models.UserAction.user_id == user_id
    ).group_by(models.UserAction.action_type).order_by(db.text('count DESC')).first()
    favorite_game = favorite_game_query[0] if favorite_game_query else None

    return ProfileGameStats(
        user_id=user_id,
        total_games_played=db.query(models.UserAction).filter(models.UserAction.user_id == user_id).count(),
        favorite_game=favorite_game,
        recent_activities=[],  # TODO: 세부 활동 리스트 구성
        achievements=[],       # 아래 업적 엔드포인트에서 세부 제공
        current_session=None
    )

@router.get("/leaderboard", response_model=List[GameLeaderboard])
def get_game_leaderboard(game_type: Optional[str] = None, limit: int = 10, db: Session = Depends(get_db)):
    """게임별 또는 전체 리더보드"""
    if game_type:
        leaderboard_query = db.query(
            models.User.id,
            models.User.nickname,
            db.func.count(models.UserAction.id).label('score')
        ).join(
            models.UserAction, models.User.id == models.UserAction.user_id
        ).filter(
            models.UserAction.action_type == game_type
        ).group_by(
            models.User.id, models.User.nickname
        ).order_by(db.text('score DESC')).limit(limit).all()
    else:
        leaderboard_query = db.query(
            models.User.id,
            models.User.nickname,
            models.User.total_spent.label('score')
        ).order_by(models.User.total_spent.desc()).limit(limit).all()

    results: List[GameLeaderboard] = []
    # NOTE: GameLeaderboard 스키마 구조 조정 필요할 수 있음 (현재 정의와 불일치 가능)
    for rank, (user_id, nickname, score) in enumerate(leaderboard_query, 1):
        results.append(GameLeaderboard(
            game_type=game_type or 'overall',
            period='daily',
            entries=[],  # 간단화 - 상세 항목 분리 가능
            user_rank=rank,
            updated_at=datetime.utcnow()
        ))
    return results

@router.get("/achievements/{user_id}", response_model=List[Achievement])
def get_user_achievements(user_id: int, db: Session = Depends(get_db)):
    """사용자 업적 목록 (기본 예시)"""
    # TODO: 실제 업적 계산 로직 통합
    sample = Achievement(
        id=1,
        name="First Spin",
        description="첫 게임 플레이 완료",
        badge_icon="🎯",
        badge_color="#FFD700",
        achieved_at=datetime.utcnow(),
        progress=1.0
    )
    return [sample]

@router.post("/session/start", response_model=GameSession)
def start_game_session(game_type: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """게임 세션 시작"""
    session = GameSession(
        session_id=str(uuid4()),
        user_id=current_user.id,
        game_type=game_type,
        start_time=datetime.utcnow(),
        status="active"
    )
    action = models.UserAction(
        user_id=current_user.id,
        action_type="SESSION_START",
        action_data=json.dumps({"game_type": game_type, "session_id": session.session_id})
    )
    db.add(action)
    db.commit()
    return session

@router.post("/session/end")
def end_game_session(session_id: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """게임 세션 종료"""
    action = models.UserAction(
        user_id=current_user.id,
        action_type="SESSION_END",
        action_data=json.dumps({"session_id": session_id, "ended_at": datetime.utcnow().isoformat()})
    )
    db.add(action)
    db.commit()
    return {"message": "Session ended"}

# Helper
from uuid import uuid4

def calculate_user_streak(user_id: int, db: Session) -> int:
    today = datetime.utcnow().date()
    streak = 0
    for i in range(30):
        check_date = today - timedelta(days=i)
        activity = db.query(models.UserAction).filter(
            models.UserAction.user_id == user_id,
            db.func.date(models.UserAction.created_at) == check_date
        ).first()
        if activity:
            streak += 1
        else:
            break
    return streak
