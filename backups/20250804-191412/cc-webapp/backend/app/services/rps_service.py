"""RPS (Rock-Paper-Scissors) 게임 서비스."""

from dataclasses import dataclass
from typing import Optional, Dict, List
import random
import logging
from sqlalchemy.orm import Session

from .token_service import TokenService
from ..repositories.game_repository import GameRepository
from .. import models

logger = logging.getLogger(__name__)

@dataclass
class RPSResult:
    """RPS 게임 결과 데이터."""
    user_choice: str
    computer_choice: str
    result: str  # "win", "lose", "draw"
    tokens_change: int
    balance: int
    daily_play_count: int

class RPSService:
    """RPS (Rock-Paper-Scissors) 게임 로직을 담당하는 서비스."""
    
    VALID_CHOICES = ["rock", "paper", "scissors"]
    WINNING_COMBINATIONS = {"rock": "scissors", "paper": "rock", "scissors": "paper"}
    
    # 수익성 목표: 하우스 엣지 12% (RTP 88%)
    # (Win_Rate * 2) + (Draw_Rate * 1) = 0.88
    # Draw_Rate = 0.10 으로 고정 시, Win_Rate = 0.39
    WIN_RATE = 0.39  # 39%
    DRAW_RATE = 0.10 # 10%
    LOSE_RATE = 0.51 # 51%

    def __init__(self, repository: Optional[GameRepository] = None, token_service: Optional[TokenService] = None, db: Optional[Session] = None) -> None:
        self.repo = repository or GameRepository()
        self.token_service = token_service or TokenService(db or None, self.repo)
        
    def _get_winning_choice(self, user_choice: str) -> str:
        """사용자 선택을 이기는 AI 선택을 반환"""
        winning_map = {"rock": "paper", "paper": "scissors", "scissors": "rock"}
        return winning_map[user_choice]
    
    def _get_computer_choice(self, user_choice: str) -> tuple[str, str]:
        """RTP 88%에 기반한 컴퓨터 선택 및 결과 결정"""
        rand = random.random()
        if rand < self.WIN_RATE:
            # 승리 (유저가 이김)
            return self.WINNING_COMBINATIONS[user_choice], "win"
        elif rand < self.WIN_RATE + self.DRAW_RATE:
            # 무승부
            return user_choice, "draw"
        else:
            # 패배 (유저가 짐)
            return self._get_winning_choice(user_choice), "lose"

    def play(self, user_id: int, user_choice: str, bet_amount: int, db: Session) -> RPSResult:
        """RPS 게임을 플레이하고 결과를 반환."""
        logger.info(f"RPS game started: user_id={user_id}, choice={user_choice}, bet_amount={bet_amount}")
        
        if user_choice not in self.VALID_CHOICES:
            raise ValueError("Invalid choice.")
        if not (5000 <= bet_amount <= 10000):
            raise ValueError("Bet amount must be between 5,000 and 10,000.")

        # 일일 플레이 횟수 제한
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise ValueError("User not found.")
        daily_limit = 5 if user.rank == "VIP" else 3
        daily_play_count = self.repo.count_daily_actions(db, user_id, "RPS_PLAY")
        if daily_play_count >= daily_limit:
            raise ValueError(f"Daily RPS play limit ({daily_limit}) exceeded.")

        # 토큰 차감
        deducted_tokens = self.token_service.deduct_tokens(user_id, bet_amount)
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
        self.repo.record_action(db, user_id, "RPS_PLAY", f'{{"bet":{bet_amount}, "result":"{result}"}}')
        
        balance = self.token_service.get_token_balance(user_id)
        
        return RPSResult(
            user_choice=user_choice,
            computer_choice=computer_choice,
            result=result,
            tokens_change=tokens_change,
            balance=balance,
            daily_play_count=daily_play_count + 1
        )
