"""
Unified Game API Router
Provides unified endpoints for all casino games including PrizeRoulette, Slots, Gacha, RPS, and Lottery.
Implements clean architecture patterns with proper error handling and response formatting.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, List
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.game_schemas import (
    RouletteInfoResponse, RouletteSpinResponse, GameStats, ProfileGameStats,
    GameLeaderboard, Achievement, GameSession
)
from app import models
from datetime import datetime, timedelta
import json

router = APIRouter(prefix="/api/games", tags=["games"])

# 1. Game Statistics API
@router.get("/stats/{user_id}", response_model=GameStats)
def get_game_stats(user_id: int, db: Session = Depends(get_db)):
    """
    Get comprehensive game statistics for a user
    Includes slot/roulette/gacha plays, wins, losses, and rewards earned
    """
    # Count total spins across all game types
    total_spins = db.query(models.UserAction).filter(
        models.UserAction.user_id == user_id,
        models.UserAction.action_type.in_(['SLOT_SPIN', 'ROULETTE_SPIN', 'GACHA_SPIN'])
    ).count()
    
    # Count total coins won
    total_coins_won = db.query(models.UserReward).filter(
        models.UserReward.user_id == user_id, 
        models.UserReward.reward.has(reward_type="COINS")
    ).count()
    
    # Count total gems won
    total_gems_won = db.query(models.UserReward).filter(
        models.UserReward.user_id == user_id, 
        models.UserReward.reward.has(reward_type="GEMS")
    ).count()
    
    # Count special items won
    special_items_won = db.query(models.UserReward).filter(
        models.UserReward.user_id == user_id, 
        models.UserReward.reward.has(reward_type="SPECIAL")
    ).count()
    
    # Count jackpots won
    jackpots_won = db.query(models.UserAction).filter(
        models.UserAction.user_id == user_id,
        models.UserAction.action_data.contains('"result":"jackpot"')
    ).count()
    
    return GameStats(
        total_spins=total_spins,
        total_wins=total_coins_won + total_gems_won + special_items_won,
        total_coins_won=total_coins_won,
        total_gems_won=total_gems_won,
        special_items_won=special_items_won,
        jackpots_won=jackpots_won,
        win_rate=round((total_coins_won + total_gems_won) / max(total_spins, 1) * 100, 2)
    )

# 2. Profile Game Statistics
@router.get("/profile/{user_id}/stats", response_model=ProfileGameStats)
def get_profile_game_stats(user_id: int, db: Session = Depends(get_db)):
    """
    Get detailed game statistics for user profile display
    Includes recent activity, favorite games, and achievement progress
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Recent 7 days activity
    week_ago = datetime.now() - timedelta(days=7)
    recent_actions = db.query(models.UserAction).filter(
        models.UserAction.user_id == user_id,
        models.UserAction.created_at >= week_ago
    ).count()
    
    # Favorite game type (most played)
    favorite_game_query = db.query(
        models.UserAction.action_type,
        db.func.count(models.UserAction.id).label('count')
    ).filter(
        models.UserAction.user_id == user_id
    ).group_by(models.UserAction.action_type).order_by(db.text('count DESC')).first()
    
    favorite_game = favorite_game_query[0] if favorite_game_query else "NONE"
    
    # Current streak (consecutive days with activity)
    current_streak = calculate_user_streak(user_id, db)
    
    return ProfileGameStats(
        user_id=user_id,
        total_games_played=db.query(models.UserAction).filter(
            models.UserAction.user_id == user_id
        ).count(),
        recent_activity=recent_actions,
        favorite_game=favorite_game,
        current_streak=current_streak,
        level=user.battlepass_level or 1,
        experience_points=user.total_spent or 0  # Using total_spent as XP proxy
    )

# 3. Game Leaderboard
@router.get("/leaderboard", response_model=List[GameLeaderboard])
def get_game_leaderboard(
    game_type: Optional[str] = None,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get game leaderboard for specified game type or overall
    Returns top players by wins, coins earned, or overall performance
    """
    if game_type:
        # Filter by specific game type
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
        # Overall leaderboard
        leaderboard_query = db.query(
            models.User.id,
            models.User.nickname,
            models.User.total_spent.label('score')
        ).order_by(
            models.User.total_spent.desc()
        ).limit(limit).all()
    
    leaderboard = []
    for rank, (user_id, nickname, score) in enumerate(leaderboard_query, 1):
        leaderboard.append(GameLeaderboard(
            rank=rank,
            user_id=user_id,
            nickname=nickname,
            score=score or 0,
            game_type=game_type or "overall"
        ))
    
    return leaderboard

# 4. User Achievements
@router.get("/achievements/{user_id}", response_model=List[Achievement])
def get_user_achievements(user_id: int, db: Session = Depends(get_db)):
    """
    Get user achievements and progress
    Returns completed achievements and progress towards incomplete ones
    """
    achievements = []
    
    # First Win Achievement
    first_win = db.query(models.UserReward).filter(
        models.UserReward.user_id == user_id
    ).first()
    achievements.append(Achievement(
        id="first_win",
        name="First Victory",
        description="Win your first reward",
        is_completed=first_win is not None,
        progress=1 if first_win else 0,
        max_progress=1
    ))
    
    # High Roller Achievement (100+ spins)
    total_spins = db.query(models.UserAction).filter(
        models.UserAction.user_id == user_id,
        models.UserAction.action_type.in_(['SLOT_SPIN', 'ROULETTE_SPIN', 'GACHA_SPIN'])
    ).count()
    achievements.append(Achievement(
        id="high_roller",
        name="High Roller",
        description="Play 100 games",
        is_completed=total_spins >= 100,
        progress=min(total_spins, 100),
        max_progress=100
    ))
    
    # Lucky Streak Achievement (jackpot wins)
    jackpots = db.query(models.UserAction).filter(
        models.UserAction.user_id == user_id,
        models.UserAction.action_data.contains('"result":"jackpot"')
    ).count()
    achievements.append(Achievement(
        id="lucky_streak",
        name="Lucky Streak",
        description="Win 5 jackpots",
        is_completed=jackpots >= 5,
        progress=min(jackpots, 5),
        max_progress=5
    ))
    
    return achievements

# 5. Active Game Session
@router.post("/session/start", response_model=GameSession)
def start_game_session(
    game_type: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Start a new game session for tracking continuous play
    Used for streak bonuses and session-based rewards
    """
    session = GameSession(
        user_id=current_user.id,
        game_type=game_type,
        start_time=datetime.now(),
        is_active=True,
        games_played=0,
        total_bet=0,
        total_won=0
    )
    
    # Store session data in user actions for tracking
    session_data = {
        "session_type": "start",
        "game_type": game_type,
        "start_time": session.start_time.isoformat()
    }
    
    action = models.UserAction(
        user_id=current_user.id,
        action_type="SESSION_START",
        action_data=json.dumps(session_data)
    )
    db.add(action)
    db.commit()
    
    return session

@router.post("/session/end")
def end_game_session(
    session_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    End active game session and calculate session bonuses
    Awards bonus rewards for extended play sessions
    """
    session_data = {
        "session_type": "end",
        "session_id": session_id,
        "end_time": datetime.now().isoformat()
    }
    
    action = models.UserAction(
        user_id=current_user.id,
        action_type="SESSION_END",
        action_data=json.dumps(session_data)
    )
    db.add(action)
    db.commit()
    
    return {"message": "Session ended successfully"}

# Helper functions
def calculate_user_streak(user_id: int, db: Session) -> int:
    """Calculate consecutive days with game activity"""
    current_date = datetime.now().date()
    streak = 0
    
    for i in range(30):  # Check up to 30 days back
        check_date = current_date - timedelta(days=i)
        
        # Check if user had any activity on this date
        daily_activity = db.query(models.UserAction).filter(
            models.UserAction.user_id == user_id,
            db.func.date(models.UserAction.created_at) == check_date
        ).first()
        
        if daily_activity:
            streak += 1
        else:
            break  # Streak broken
    
    return streak
