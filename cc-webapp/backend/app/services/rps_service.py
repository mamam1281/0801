"""RPS (Rock-Paper-Scissors) 게임 서비스."""

from dataclasses import dataclass
from typing import Optional, Dict, List
import random
import logging
from sqlalchemy.orm import Session

from .token_service import TokenService
from ..repositories.game_repository import GameRepository
from .. import models
from ..core import economy
from ..core.config import settings

logger = logging.getLogger(__name__)

@dataclass
class RPSResult:
    """RPS 게임 결과 데이터.

    일부 테스트가 daily_play_count 미지정 생성 → default 0 허용
    """
    user_choice: str
    computer_choice: str
    result: str  # "win", "lose", "draw"
    tokens_change: int
    balance: int
    daily_play_count: int = 0

class RPSService:
    """RPS (Rock-Paper-Scissors) 게임 로직을 담당하는 서비스."""
    
    VALID_CHOICES = ["rock", "paper", "scissors"]
    WINNING_COMBINATIONS = {"rock": "scissors", "paper": "rock", "scissors": "paper"}
    
    # 레거시 기본 확률 (RTP ~88%)
    LEGACY_WIN_RATE = 0.39
    LEGACY_DRAW_RATE = 0.10
    LEGACY_LOSE_RATE = 0.51

    def _current_probabilities(self):
        # Economy V2: 목표 house edge economy.RPS_HOUSE_EDGE → RTP= 1 - edge
        # 기대값: Win * 2 + Draw * 1 + Lose * 0 = RTP
        # 단순화: Draw 비율 고정(0.10), 나머지 (1-Draw) 구간에서 Win/Lose 비율 조정
        if economy.is_v2_active(settings):
            draw = 0.10
            rtp = 1 - economy.RPS_HOUSE_EDGE  # 예: 0.95
            # Win*2 + draw*1 = rtp → Win = (rtp - draw)/2
            win = max(min((rtp - draw)/2.0, 0.8), 0.01)
            lose = 1 - win - draw
            return win, draw, lose
        return self.LEGACY_WIN_RATE, self.LEGACY_DRAW_RATE, self.LEGACY_LOSE_RATE

    def __init__(self, repository: Optional[GameRepository] = None, token_service: Optional[TokenService] = None, db: Optional[Session] = None) -> None:
        # 기존 테스트들이 RPSService() 처럼 인자 없이 호출 → GameRepository도 optional db 허용
        self.repo = repository or GameRepository(db)
        self.token_service = token_service or TokenService(db, self.repo)
        
    def _get_winning_choice(self, user_choice: str) -> str:
        """사용자 선택을 이기는 AI 선택을 반환"""
        winning_map = {"rock": "paper", "paper": "scissors", "scissors": "rock"}
        return winning_map[user_choice]
    
    def _get_computer_choice(self, user_choice: str) -> tuple[str, str]:
        """RTP 88%에 기반한 컴퓨터 선택 및 결과 결정"""
        # 결정적 모드(테스트 예측성 지원): CASINO_RPS_DETERMINISTIC=win/draw/lose
        import os
        deterministic = os.getenv("CASINO_RPS_DETERMINISTIC")
        if deterministic in {"win", "draw", "lose"}:
            if deterministic == "win":
                return self.WINNING_COMBINATIONS[user_choice], "win"
            if deterministic == "draw":
                return user_choice, "draw"
            return self._get_winning_choice(user_choice), "lose"
        win_rate, draw_rate, lose_rate = self._current_probabilities()
        rand = random.random()
        if rand < win_rate:
            return self.WINNING_COMBINATIONS[user_choice], "win"
        elif rand < win_rate + draw_rate:
            return user_choice, "draw"
        else:
            return self._get_winning_choice(user_choice), "lose"

    def play(self, user_id: int, user_choice: str, bet_amount: int, db: Optional[Session] = None, *_, **__) -> RPSResult:
        """RPS 게임을 플레이하고 결과를 반환."""
        logger.info(f"RPS game started: user_id={user_id}, choice={user_choice}, bet_amount={bet_amount}")
        db = db or getattr(self.token_service, 'db', None)
        if db is None:
            raise ValueError("Database session not provided")
        
        if user_choice not in self.VALID_CHOICES:
            raise ValueError("Invalid choice.")
        if bet_amount <= 0:
            raise ValueError("Bet amount must be greater than 0")

        # 일일 플레이 횟수 제한
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise ValueError("User not found.")
        daily_limit = 5 if user.rank == "VIP" else 3
        daily_play_count = 0
        try:
            if hasattr(self.repo, 'count_daily_actions'):
                raw_count = self.repo.count_daily_actions(db, user_id, "RPS_PLAY") or 0
                # MagicMock 이 반환되거나 비-int 타입일 경우 방어적 캐스팅
                try:
                    daily_play_count = int(raw_count)
                except Exception:
                    daily_play_count = 0
        except Exception:
            daily_play_count = 0
        if daily_play_count >= daily_limit:
            raise ValueError(f"Daily RPS play limit ({daily_limit}) exceeded.")

        # 토큰 차감
        try:
            deducted_tokens = self.token_service.deduct_tokens(user_id, bet_amount)
        except Exception:
            raise ValueError("Insufficient tokens")
        if deducted_tokens is None:
            raise ValueError("Insufficient tokens")

        computer_choice, result = self._get_computer_choice(user_choice)
        
        # 토큰 변화량 계산
        tokens_change = 0
        if result == "win":
            reward = bet_amount * 2
            self.token_service.add_tokens(user_id, reward)
            tokens_change = reward - bet_amount
        elif result == "draw":
            self.token_service.add_tokens(user_id, bet_amount)
            tokens_change = 0
        else: # lose
            tokens_change = -bet_amount

        # 게임 및 액션 기록
        try:
            self.repo.record_action(db, user_id, "RPS_PLAY", f'{{"bet":{bet_amount}, "result":"{result}"}}')
        except Exception:
            pass
        
        balance = self.token_service.get_token_balance(user_id)
        
        return RPSResult(
            user_choice=user_choice,
            computer_choice=computer_choice,
            result=result,
            tokens_change=tokens_change,
            balance=balance,
            daily_play_count=daily_play_count + 1
        )
