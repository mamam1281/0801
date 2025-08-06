from typing import Optional

from sqlalchemy.orm import Session

from ..repositories.game_repository import GameRepository
from .. import models
from .slot_service import SlotService, SlotSpinResult
from .roulette_service import RouletteService, RouletteSpinResult, PrizeRouletteSpinResult, Prize
from .gacha_service import GachaService, GachaPullResult
from .rps_service import RPSService, RPSResult
from .token_service import TokenService

class GameService:
    """게임 서비스 클래스: 모든 게임 기능의 통합 인터페이스 제공.
    
    위임 패턴을 통해 구체적인 게임 로직은 각 특화된 서비스 클래스에 위임합니다.
    """

    def __init__(self, db: Session, repository: "GameRepository | None" = None):
        """게임 서비스 초기화.

        Args:
            db: 데이터베이스 세션
            repository: 게임 레포지토리. 없으면 새로 생성됨
        """
        self.db = db
        self.repo = repository or GameRepository(self.db)
        self.token_service = TokenService(self.db)
        self.slot_service = SlotService(self.repo, self.token_service)
        self.roulette_service = RouletteService(self.repo, self.token_service)
        self.gacha_service = GachaService(self.repo, self.token_service)
        self.rps_service = RPSService(self.repo, self.token_service)

    def slot_spin(self, user_id: int, bet_amount: int) -> SlotSpinResult:
        """슬롯 게임 스핀을 실행.
        
        Args:
            user_id: 사용자 ID
            bet_amount: 베팅 금액
            
        Returns:
            SlotSpinResult: 슬롯 스핀 결과
        """
        return self.slot_service.spin(user_id, bet_amount, self.db)

    def roulette_spin(
        self,
        user_id: int,
        bet: int,
        bet_type: str,
        value: Optional[str],
    ) -> RouletteSpinResult:
        """룰렛 게임 스핀 실행.
        
        Args:
            user_id: 사용자 ID
            bet: 베팅 금액
            bet_type: 베팅 타입(number, color, odd_even)
            value: 베팅 값
            
        Returns:
            RouletteSpinResult: 룰렛 스핀 결과
        """
        return self.roulette_service.spin(user_id, bet, bet_type, value, self.db)

    def gacha_pull(self, user_id: int, count: int) -> GachaPullResult:
        """가챠 뽑기 실행.
        
        Args:
            user_id: 사용자 ID
            count: 뽑기 횟수

        Returns:
            GachaPullResult: 가챠 뽑기 결과
        """
        return self.gacha_service.pull(user_id, count, self.db)

    def rps_play(self, user_id: int, choice: str, bet_amount: int) -> RPSResult:
        """RPS (Rock-Paper-Scissors) 게임 플레이.
        
        Args:
            user_id: 사용자 ID
            choice: 사용자 선택 (rock, paper, scissors)
            bet_amount: 베팅 금액
            
        Returns:
            RPSResult: RPS 게임 결과
        """
        return self.rps_service.play(user_id, choice, bet_amount, self.db)

    def spin_prize_roulette(self, user_id: int) -> PrizeRouletteSpinResult:
        """경품추첨 룰렛 스핀.
        
        Args:
            user_id: 사용자 ID
            
        Returns:
            PrizeRouletteSpinResult: 경품 룰렛 스핀 결과
        """
        return self.roulette_service.spin_prize_roulette(user_id)

    def get_roulette_spins_left(self, user_id: int) -> int:
        """사용자의 일일 룰렛 스핀 횟수 조회.
        
        Args:
            user_id: 사용자 ID
            
        Returns:
            int: 남은 스핀 횟수
        """
        return self.roulette_service.get_spins_left(user_id)

    def get_roulette_prizes(self) -> list[dict]:
        """룰렛 경품 목록 조회.
        
        Returns:
            list[dict]: 경품 목록
        """
        return self.roulette_service.get_prizes()
