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
from ..services.game_service import GameService
from ..services.history_service import log_game_history
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
from sqlalchemy import text
from ..utils.redis import update_streak_counter
from ..core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/games", tags=["Games"])

# ----------------------------- GameHistory 조회 스키마 (간단 내장) -----------------------------
from pydantic import BaseModel

class GameHistoryItem(BaseModel):
    id: int
    user_id: int
    game_type: str
    action_type: str
    delta_coin: int
    delta_gem: int
    created_at: datetime
    result_meta: Optional[Dict[str, Any]] = None

    class Config:
        orm_mode = True

class GameHistoryListResponse(BaseModel):
    total: int
    items: List[GameHistoryItem]
    limit: int
    offset: int

# ----------------------------- GameHistory 기반 통계 스키마 -----------------------------
class GameTypeStats(BaseModel):
    game_type: str
    play_count: int
    net_coin: int
    net_gem: int
    wins: int
    losses: int
    last_played_at: Optional[datetime]

class ProfileAggregateStats(BaseModel):
    user_id: int
    total_play_count: int
    total_net_coin: int
    total_net_gem: int
    distinct_game_types: int
    favorite_game_type: Optional[str]
    recent_game_types: List[str]
    last_played_at: Optional[datetime]

# ----------------------------- Follow API 스키마 -----------------------------
class FollowActionResponse(BaseModel):
    success: bool
    following: bool
    target_user_id: int
    follower_count: int
    following_count: int

class FollowListItem(BaseModel):
    user_id: int
    nickname: str
    followed_at: datetime

class FollowListResponse(BaseModel):
    total: int
    items: List[FollowListItem]
# 가챠 확률 공개/구성 조회
@router.get("/gacha/config")
async def get_gacha_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = GameService(db)
    return svc.gacha_service.get_config()

# 유저별 가챠 통계/히스토리 요약
@router.get("/gacha/stats")
async def get_gacha_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = GameService(db)
    return svc.gacha_service.get_user_gacha_stats(current_user.id)

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
    # Load symbol weights from settings with safe fallback
    cfg_weights = getattr(settings, 'SLOT_SYMBOL_WEIGHTS', None) or {
        '🍒': 30, '🍋': 25, '🍊': 20, '🍇': 15, '💎': 8, '7️⃣': 2
    }
    # keep order stable for reproducibility in tests
    symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣']
    weights = [cfg_weights.get(sym, 1) for sym in symbols]
    reels = [random.choices(symbols, weights=weights)[0] for _ in range(3)]
    
    # 승리 판정
    win_amount = 0
    if reels[0] == reels[1] == reels[2]:
        multiplier = {'🍒': 2, '🍋': 3, '🍊': 4, '🍇': 5, '💎': 10, '7️⃣': 50}
        win_amount = bet_amount * multiplier.get(reels[0], 1)
    elif reels[0] == reels[1] or reels[1] == reels[2]:
        win_amount = int(bet_amount * 1.5)
    
    # 스트릭/변동 보상: 플레이 스트릭 증가(24h TTL) 및 소폭 보너스 가중치
    # 슬롯 플레이 스트릭은 "플레이 연속 시도" 기준으로 증가(승패 무관). 보너스는 승리 시에만 적용.
    streak_count = 0
    try:
        streak_count = update_streak_counter(str(current_user.id), "SLOT_SPIN", increment=True)
    except Exception:
        streak_count = 0

    if win_amount > 0:
        # 최대 +20%까지 승리 보너스 (연속 시도 기반) + 경미한 랜덤 변동(±5%)
        bonus_multiplier = 1.0 + min(max(streak_count, 0) * 0.02, 0.20)
        rng_variation = random.uniform(0.95, 1.05)
        win_amount = int(win_amount * bonus_multiplier * rng_variation)

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
        action_data=str({**action_data, "streak": streak_count})
    )
    db.add(user_action)
    db.commit()
    
    message = "Jackpot!" if action_data["is_jackpot"] else ("Win" if win_amount > 0 else "Better luck next time")
    # SlotSpinResponse expects reels as List[List[str]]
    reels_matrix = [reels]
    # Derive an effective multiplier for reference (0 on lose)
    eff_multiplier = 0.0 if bet_amount <= 0 else round(win_amount / float(bet_amount), 2)
    # GameHistory 로그 (return 이전)
    try:
        delta = -bet_amount + win_amount
        log_game_history(
            db,
            user_id=current_user.id,
            game_type="slot",
            action_type="WIN" if win_amount > 0 else "BET",
            delta_coin=delta,
            result_meta={"reels": reels, "bet": bet_amount, "win": win_amount, "jackpot": action_data["is_jackpot"], "streak": streak_count}
        )
    except Exception as e:
        logger.warning(f"slot spin history log failed: {e}")
    return {
        'success': True,
        'reels': reels_matrix,
        'win_amount': win_amount,
        'win_lines': [],
        'multiplier': eff_multiplier if win_amount > 0 else 0.0,
        'is_jackpot': action_data["is_jackpot"],
        'free_spins_awarded': 0,
        'message': message,
        'balance': new_balance,
        'special_animation': 'near_miss' if win_amount == 0 and (reels[0] == reels[1] or reels[1] == reels[2]) else None
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
    # GameHistory 로그 (return 이전)
    try:
        delta = -bet_amount + win_amount
        log_game_history(
            db,
            user_id=current_user.id,
            game_type="rps",
            action_type="WIN" if result == 'win' else ("DRAW" if result == 'draw' else "BET"),
            delta_coin=delta,
            result_meta={"bet": bet_amount, "user_choice": user_choice, "ai_choice": ai_choice, "result": result}
        )
    except Exception as e:
        logger.warning(f"rps play history log failed: {e}")
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
    가챠 뽑기 (서비스 레이어 위임: 피티, 근접실패, 10연 할인 적용)
    """
    pull_count = max(1, int(request.pull_count or 1))

    # 서비스 초기화
    game_service = GameService(db)

    # pull_count을 10연 단위와 단일 뽑기로 배치 실행
    batches_of_10 = pull_count // 10
    singles = pull_count % 10

    all_results: list[str] = []
    last_animation: str | None = None
    last_message: str | None = None

    # 10연 배치 실행
    for _ in range(batches_of_10):
        res = game_service.gacha_pull(current_user.id, 10)
        all_results.extend(res.results)
        last_animation = res.animation_type or last_animation
        last_message = res.psychological_message or last_message

    # 단일 실행
    for _ in range(singles):
        res = game_service.gacha_pull(current_user.id, 1)
        all_results.extend(res.results)
        last_animation = res.animation_type or last_animation
        last_message = res.psychological_message or last_message

    # 현재 잔액 조회
    new_balance = SimpleUserService.get_user_tokens(db, current_user.id)

    # 결과를 응답 스키마에 맞게 매핑
    def _to_item(result_token: str) -> Dict[str, Any]:
        # 결과 토큰에서 실제 희귀도 추출 (near_miss 접미사 제거)
        base = (
            result_token.replace("_near_miss_epic", "")
            .replace("_near_miss_legendary", "")
            .replace("_near_miss", "")
        )
        rarity = base.lower()
        name = f"{rarity.capitalize()} Item"
        return {"name": name, "rarity": rarity}

    items = [_to_item(tok) for tok in all_results[:pull_count]]

    # 카운트 집계
    rare_count = sum(1 for it in items if it["rarity"] == "rare")
    ultra_rare_count = sum(1 for it in items if it["rarity"] in ("epic", "legendary"))

    # special_animation: mirror animation_type for non-normal states for easier FE handling
    special_anim = last_animation if (last_animation in {"near_miss", "epic", "legendary", "pity"}) else None

    return {
        "success": True,
        "items": items,
        "rare_item_count": rare_count,
        "ultra_rare_item_count": ultra_rare_count,
        "pull_count": pull_count,
        "balance": new_balance,
        "special_animation": special_anim,
        "animation_type": last_animation or "normal",
        "psychological_message": last_message or "다음 뽑기에 더 좋은 결과가 기다리고 있을지도 몰라요!",
        "message": "Gacha pull completed",
        "currency_balance": {"tokens": new_balance},
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

    # Optional crash persistence (best-effort, no hard failure)
    try:
        # Ensure session row exists
        db.execute(text(
            """
            INSERT INTO crash_sessions (external_session_id, user_id, bet_amount, status, auto_cashout_multiplier, actual_multiplier, win_amount)
            VALUES (:external_session_id, :user_id, :bet_amount, :status, :auto_cashout_multiplier, :actual_multiplier, :win_amount)
            ON CONFLICT (external_session_id) DO UPDATE SET
                auto_cashout_multiplier = EXCLUDED.auto_cashout_multiplier,
                actual_multiplier = EXCLUDED.actual_multiplier,
                win_amount = EXCLUDED.win_amount,
                status = CASE WHEN EXCLUDED.win_amount > 0 THEN 'cashed' ELSE crash_sessions.status END
            """
        ), {
            "external_session_id": game_id,
            "user_id": current_user.id,
            "bet_amount": bet_amount,
            "status": "active",
            "auto_cashout_multiplier": auto_cashout_multiplier,
            "actual_multiplier": multiplier,
            "win_amount": win_amount,
        })
        # Insert bet row
        db.execute(text(
            """
            INSERT INTO crash_bets (session_id, user_id, bet_amount, payout_amount, cashout_multiplier, status)
            SELECT s.id, :user_id, :bet_amount, :payout_amount, :cashout_multiplier,
                   CASE WHEN :payout_amount IS NOT NULL AND :payout_amount > 0 THEN 'cashed' ELSE 'placed' END
            FROM crash_sessions s
            WHERE s.external_session_id = :external_session_id
            """
        ), {
            "external_session_id": game_id,
            "user_id": current_user.id,
            "bet_amount": bet_amount,
            "payout_amount": win_amount if win_amount > 0 else None,
            "cashout_multiplier": auto_cashout_multiplier if win_amount > 0 else None,
        })
        db.commit()
    except Exception as _e:
        db.rollback()
        # Log softly without breaking API
        logger.warning(f"Crash persistence skipped: {_e}")
    
    potential_win = int(bet_amount * (auto_cashout_multiplier or multiplier))
    # GameHistory 로그 (return 이전)
    try:
        delta = -bet_amount + win_amount
        log_game_history(
            db,
            user_id=current_user.id,
            game_type="crash",
            action_type="WIN" if win_amount > 0 else "BET",
            delta_coin=delta,
            result_meta={"bet": bet_amount, "auto_cashout": auto_cashout_multiplier, "actual_multiplier": multiplier, "win": win_amount}
        )
    except Exception as e:
        logger.warning(f"crash bet history log failed: {e}")
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

# --------------------------- GameHistory 조회 엔드포인트 ---------------------------
@router.get("/history", response_model=GameHistoryListResponse)
def get_game_history(
    game_type: Optional[str] = None,
    action_type: Optional[str] = None,
    since: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """현재 사용자 GameHistory 조회

    필터:
      - game_type, action_type (정확 일치)
      - since (ISO8601 문자열) 이후
    페이지네이션:
      - limit / offset
    정렬: 최신(created_at desc)
    """
    from ..models.history_models import GameHistory
    q = db.query(GameHistory).filter(GameHistory.user_id == current_user.id)
    if game_type:
        q = q.filter(GameHistory.game_type == game_type)
    if action_type:
        q = q.filter(GameHistory.action_type == action_type)
    if since:
        try:
            dt = datetime.fromisoformat(since.replace('Z',''))
            q = q.filter(GameHistory.created_at >= dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="since 형식이 잘못되었습니다(ISO8601)")
    total = q.count()
    items = q.order_by(GameHistory.created_at.desc()).limit(min(limit, 200)).offset(offset).all()
    return GameHistoryListResponse(
        total=total,
        items=items,
        limit=min(limit,200),
        offset=offset
    )

# ----------------------------- /api/games/{game_type}/stats (GameHistory) -----------------------------
@router.get("/{game_type}/stats", response_model=GameTypeStats)
def get_game_type_stats(
    game_type: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from ..models.history_models import GameHistory
    q = db.query(GameHistory).filter(
        GameHistory.user_id == current_user.id,
        GameHistory.game_type == game_type
    )
    play_count = q.count()
    agg = db.query(
        db.func.coalesce(db.func.sum(GameHistory.delta_coin), 0),
        db.func.coalesce(db.func.sum(GameHistory.delta_gem), 0),
        db.func.coalesce(db.func.sum(db.case((GameHistory.action_type == 'WIN', 1), else_=0)), 0),
        db.func.coalesce(db.func.sum(db.case((GameHistory.action_type.in_(['BET','LOSE']), 1), else_=0)), 0),
        db.func.max(GameHistory.created_at)
    ).filter(
        GameHistory.user_id == current_user.id,
        GameHistory.game_type == game_type
    ).one()
    net_coin, net_gem, wins, losses, last_played = agg
    return GameTypeStats(
        game_type=game_type,
        play_count=play_count,
        net_coin=net_coin,
        net_gem=net_gem,
        wins=wins,
        losses=losses,
        last_played_at=last_played
    )

# ----------------------------- /api/profile/stats (GameHistory) -----------------------------
@router.get("/profile/stats", response_model=ProfileAggregateStats)
def get_profile_stats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from ..models.history_models import GameHistory
    base_q = db.query(GameHistory).filter(GameHistory.user_id == current_user.id)
    total_play = base_q.count()
    sums = db.query(
        db.func.coalesce(db.func.sum(GameHistory.delta_coin), 0),
        db.func.coalesce(db.func.sum(GameHistory.delta_gem), 0),
        db.func.max(GameHistory.created_at)
    ).filter(GameHistory.user_id == current_user.id).one()
    net_coin, net_gem, last_played = sums
    # 즐겨찾기 게임: play count 상위 1개
    fav_row = db.query(
        GameHistory.game_type,
        db.func.count(GameHistory.id).label('cnt')
    ).filter(GameHistory.user_id == current_user.id).group_by(GameHistory.game_type).order_by(db.text('cnt DESC')).first()
    favorite = fav_row[0] if fav_row else None
    distinct_game_types = db.query(db.func.count(db.func.distinct(GameHistory.game_type))).filter(GameHistory.user_id == current_user.id).scalar() or 0
    recent_game_types_rows = db.query(GameHistory.game_type).filter(GameHistory.user_id == current_user.id).order_by(GameHistory.created_at.desc()).limit(5).all()
    recent_game_types = []
    seen = set()
    for (gt,) in recent_game_types_rows:
        if gt not in seen:
            seen.add(gt)
            recent_game_types.append(gt)
        if len(recent_game_types) >= 5:
            break
    return ProfileAggregateStats(
        user_id=current_user.id,
        total_play_count=total_play,
        total_net_coin=net_coin,
        total_net_gem=net_gem,
        distinct_game_types=distinct_game_types,
        favorite_game_type=favorite,
        recent_game_types=recent_game_types,
        last_played_at=last_played
    )

# ----------------------------- Follow API 구현 -----------------------------
@router.post("/follow/{target_user_id}", response_model=FollowActionResponse)
def follow_user(
    target_user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from ..models.social_models import FollowRelation
    if target_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="자기 자신은 팔로우할 수 없습니다")
    # 대상 유저 존재 확인
    target = db.query(models.User).filter(models.User.id == target_user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="대상 유저를 찾을 수 없습니다")
    existing = db.query(FollowRelation).filter(
        FollowRelation.user_id == current_user.id,
        FollowRelation.target_user_id == target_user_id
    ).first()
    if existing:
        # 이미 팔로우 상태 → idempotent 응답
        follower_count = db.query(FollowRelation).filter(FollowRelation.target_user_id == target_user_id).count()
        following_count = db.query(FollowRelation).filter(FollowRelation.user_id == current_user.id).count()
        return FollowActionResponse(success=True, following=True, target_user_id=target_user_id, follower_count=follower_count, following_count=following_count)
    rel = FollowRelation(user_id=current_user.id, target_user_id=target_user_id)
    db.add(rel)
    db.commit()
    follower_count = db.query(FollowRelation).filter(FollowRelation.target_user_id == target_user_id).count()
    following_count = db.query(FollowRelation).filter(FollowRelation.user_id == current_user.id).count()
    return FollowActionResponse(success=True, following=True, target_user_id=target_user_id, follower_count=follower_count, following_count=following_count)

@router.delete("/follow/{target_user_id}", response_model=FollowActionResponse)
def unfollow_user(
    target_user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from ..models.social_models import FollowRelation
    rel = db.query(FollowRelation).filter(
        FollowRelation.user_id == current_user.id,
        FollowRelation.target_user_id == target_user_id
    ).first()
    if rel:
        db.delete(rel)
        db.commit()
    follower_count = db.query(FollowRelation).filter(FollowRelation.target_user_id == target_user_id).count()
    following_count = db.query(FollowRelation).filter(FollowRelation.user_id == current_user.id).count()
    return FollowActionResponse(success=True, following=False, target_user_id=target_user_id, follower_count=follower_count, following_count=following_count)

@router.get("/follow/list", response_model=FollowListResponse)
def list_following(
    limit: int = 50,
    offset: int = 0,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from ..models.social_models import FollowRelation
    q = db.query(FollowRelation, models.User).join(models.User, FollowRelation.target_user_id == models.User.id).filter(FollowRelation.user_id == current_user.id)
    total = q.count()
    rows = q.order_by(FollowRelation.created_at.desc()).limit(min(limit,200)).offset(offset).all()
    items = [
        FollowListItem(user_id=user.id, nickname=user.nickname, followed_at=rel.created_at)
        for rel, user in rows
    ]
    return FollowListResponse(total=total, items=items, limit=min(limit,200), offset=offset)

@router.get("/follow/followers", response_model=FollowListResponse)
def list_followers(
    limit: int = 50,
    offset: int = 0,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from ..models.social_models import FollowRelation
    q = db.query(FollowRelation, models.User).join(models.User, FollowRelation.user_id == models.User.id).filter(FollowRelation.target_user_id == current_user.id)
    total = q.count()
    rows = q.order_by(FollowRelation.created_at.desc()).limit(min(limit,200)).offset(offset).all()
    items = [
        FollowListItem(user_id=user.id, nickname=user.nickname, followed_at=rel.created_at)
        for rel, user in rows
    ]
    return FollowListResponse(total=total, items=items, limit=min(limit,200), offset=offset)
