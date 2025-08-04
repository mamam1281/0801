"""
게임 관련 스키마 정의

PrizeRoulette 게임 및 프로필 API에서 사용하는 요청/응답 스키마 정의
"""
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

# 프라이즈 룰렛 스키마 정의
class Prize(BaseModel):
    """룰렛 상품 모델"""
    id: str
    name: str
    value: int
    color: str
    probability: float
    icon: Optional[str] = None


class RouletteInfoResponse(BaseModel):
    """룰렛 정보 응답 모델"""
    success: bool = True
    spins_left: int
    max_spins: int = 3
    cooldown_expires: Optional[str] = None
    prizes: List[Prize]
    recent_spins: Optional[List[Dict[str, Any]]] = None
    message: Optional[str] = None


class RouletteSpinRequest(BaseModel):
    """룰렛 스핀 요청 모델 (필요시)"""
    pass


class RouletteSpinResponse(BaseModel):
    """룰렛 스핀 응답 모델"""
    success: bool
    prize: Optional[Prize] = None
    message: str
    spins_left: int
    cooldown_expires: Optional[str] = None
    is_near_miss: Optional[bool] = False
    animation_type: Optional[str] = "normal"


# 게임 통계 스키마
class GameStats(BaseModel):
    """사용자 게임 통계 모델"""
    user_id: int
    total_spins: int = 0
    total_coins_won: int = 0
    total_gems_won: int = 0
    special_items_won: int = 0
    jackpots_won: int = 0
    bonus_spins_won: int = 0
    best_streak: int = 0
    current_streak: int = 0
    last_spin_date: Optional[datetime] = None


class GameSession(BaseModel):
    """게임 세션 모델"""
    session_id: str
    user_id: int
    game_type: str
    start_time: datetime
    duration: Optional[int] = None  # 초 단위
    current_bet: Optional[int] = 0
    current_round: Optional[int] = 0
    status: str = "active"


# 프로필 API 스키마
class UserGameActivity(BaseModel):
    """사용자 게임 활동 요약"""
    game_type: str
    total_rounds: int = 0
    total_wins: int = 0
    total_losses: int = 0
    win_rate: float = 0.0
    favorite: bool = False
    last_played: Optional[datetime] = None


class Achievement(BaseModel):
    """사용자 업적"""
    id: int
    name: str
    description: str
    badge_icon: str
    badge_color: str
    achieved_at: Optional[datetime] = None
    progress: Optional[float] = None  # 0.0 ~ 1.0


class ProfileGameStats(BaseModel):
    """프로필 게임 통계 응답"""
    user_id: int
    total_games_played: int = 0
    total_time_played: Optional[int] = None  # 분 단위
    favorite_game: Optional[str] = None
    recent_activities: List[UserGameActivity] = []
    achievements: List[Achievement] = []
    current_session: Optional[GameSession] = None


# 리더보드 스키마
class LeaderboardEntry(BaseModel):
    """리더보드 항목"""
    rank: int
    user_id: int
    nickname: str
    score: int
    avatar_url: Optional[str] = None


class GameLeaderboard(BaseModel):
    """게임 리더보드 응답"""
    game_type: str
    period: str
    entries: List[LeaderboardEntry] = []
    user_rank: Optional[int] = None
    updated_at: datetime
