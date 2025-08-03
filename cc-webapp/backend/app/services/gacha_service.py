from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional
from sqlalchemy.orm import Session
import random
import os
import json
import logging

from .token_service import TokenService
from ..repositories.game_repository import GameRepository


@dataclass
class GachaPullResult:
    results: List[str]
    tokens_change: int
    balance: int
    near_miss_occurred: bool = False
    animation_type: str = "normal"
    psychological_message: str = ""


class GachaService:
    """가챠 뽑기 로직을 담당하는 서비스.

    확률 테이블과 보상 풀은 환경 변수에서 로드되며, 런타임에 갱신할 수 있습니다.
    심리적 효과를 강화한 수익성 최적화 시스템이 적용되었습니다.
    """

    # 수익성 개선을 위한 하우스 엣지가 적용된 확률 테이블 (심리적 효과 강화)
    DEFAULT_RARITY_TABLE: list[tuple[str, float]] = [
        ("Legendary", 0.002),   # 0.2% (극도로 희귀 - 심리적 갈망 증폭)
        ("Epic", 0.025),        # 2.5% (감소하여 희소성 강화)
        ("Rare", 0.15),         # 15% (감소)
        ("Common", 0.65),       # 65% (감소)
        ("Near_Miss_Epic", 0.08),    # 8% (Epic 근접 실패)
        ("Near_Miss_Legendary", 0.093), # 9.3% (Legendary 근접 실패)
    ]

    def __init__(self, repository: GameRepository | None = None, token_service: TokenService | None = None, db: Optional[Session] = None) -> None:
        self.repo = repository or GameRepository()
        self.token_service = token_service or TokenService(db or None, self.repo)
        self.logger = logging.getLogger(__name__)
        self.rarity_table = self._load_rarity_table()
        self.reward_pool = self._load_reward_pool()

    def _load_rarity_table(self) -> List[Tuple[str, float]]:
        """환경 변수에서 확률 테이블을 로드"""
        table_json = os.getenv("GACHA_RARITY_TABLE")
        if table_json:
            try:
                data = json.loads(table_json)
                return [(str(name), float(prob)) for name, prob in data]
            except Exception as e:  # noqa: BLE001
                self.logger.error("Invalid GACHA_RARITY_TABLE: %s", e)
        return self.DEFAULT_RARITY_TABLE.copy()

    def _load_reward_pool(self) -> Dict[str, int]:
        """환경 변수에서 보상 풀 정보를 로드"""
        pool_json = os.getenv("GACHA_REWARD_POOL")
        if pool_json:
            try:
                data = json.loads(pool_json)
                return {str(k): int(v) for k, v in data.items()}
            except Exception as e:  # noqa: BLE001
                self.logger.error("Invalid GACHA_REWARD_POOL: %s", e)
        # 기본 풀은 무한으로 간주
        return {}
    
    def _calculate_near_miss_probability(self, user_id: int, current_count: int) -> float:
        """근접 실패 확률 계산 (심리적 효과 최적화)"""
        base_near_miss_rate = 0.173  # 기본 17.3% (Epic + Legendary 근접 실패)
        
        # 연속 실패 횟수가 많을수록 근접 실패 확률 증가 (재도전 유도)
        if current_count > 50:
            base_near_miss_rate += 0.1  # +10%
        elif current_count > 30:
            base_near_miss_rate += 0.05  # +5%
        
        return min(base_near_miss_rate, 0.3)  # 최대 30%로 제한
    
    def _generate_psychological_message(self, rarity: str, near_miss: bool, consecutive_fails: int) -> str:
        """심리적 메시지 생성"""
        if near_miss:
            messages = [
                "아! 정말 아깝네요! 다음번엔 분명 좋은 결과가 있을 거예요!",
                "거의 다 왔어요! 한 번만 더 도전해보세요!",
                "이렇게 가까웠다니... 다음 뽑기가 기대되네요!",
                "운이 올라오고 있어요! 포기하지 마세요!"
            ]
            return random.choice(messages)
        elif rarity == "Legendary":
            return "🎉 축하합니다! 전설급 아이템을 획득했습니다! 🎉"
        elif rarity == "Epic":
            return "✨ 멋진 에픽 아이템을 획득했습니다! ✨"
        elif consecutive_fails >= 5:
            return "계속 도전하시는 모습이 멋져요! 곧 좋은 일이 생길 거예요!"
        else:
            return "다음 뽑기에 더 좋은 결과가 기다리고 있을지도 몰라요!"

    def get_config(self) -> dict:
        """현재 설정 정보를 반환"""
        return {"rarity_table": self.rarity_table, "reward_pool": self.reward_pool}

    def update_config(self, *, rarity_table: List[Tuple[str, float]] | None = None, reward_pool: Dict[str, int] | None = None) -> None:
        """확률 테이블 및 보상 풀을 업데이트"""
        if rarity_table is not None:
            self.rarity_table = rarity_table
        if reward_pool is not None:
            self.reward_pool = reward_pool

    def pull(self, user_id: int, count: int, db: Session) -> GachaPullResult:
        """가챠 뽑기를 수행 (심리적 효과 강화)."""
        pulls = 10 if count >= 10 else 1
        cost = 450 if pulls == 10 else 50
        self.logger.info("Deducting %s tokens from user %s", cost, user_id)
        
        deducted_tokens = self.token_service.deduct_tokens(user_id, cost)
        if deducted_tokens is None:
            raise ValueError("토큰이 부족합니다.")

        results: List[str] = []
        current_count = self.repo.get_gacha_count(user_id)
        history = self.repo.get_gacha_history(user_id)
        
        # 근접 실패 추적
        near_miss_occurred = False
        animation_type = "normal"
        consecutive_fails = current_count

        rarity_table = self.rarity_table

        for _ in range(pulls):
            current_count += 1
            pity = current_count >= 90
            rnd = random.random()
            cumulative = 0.0
            rarity = "Common"
            
            # 심리적 효과를 위한 확률 조정
            adjusted_table = []
            near_miss_boost = self._calculate_near_miss_probability(user_id, current_count)
            
            for name, prob in rarity_table:
                adj_prob = prob
                
                # 과거 히스토리 기반 확률 조정 (중복 방지 효과 감소)
                if history and name in history:
                    adj_prob *= 0.8  # 기존 0.5에서 0.8로 완화
                
                # 근접 실패 확률 부스트
                if "Near_Miss" in name:
                    adj_prob = near_miss_boost / 2  # Epic과 Legendary로 분배
                
                adjusted_table.append((name, adj_prob))
                cumulative += adj_prob
                
                if rnd <= cumulative:
                    rarity = name
                    break
            
            # 피티 시스템 적용
            if pity and rarity not in {"Epic", "Legendary"}:
                rarity = "Epic"
                current_count = 0
                animation_type = "pity"
            
            # 근접 실패 처리 (심리적 효과 강화)
            if "Near_Miss" in rarity:
                near_miss_occurred = True
                animation_type = "near_miss"
                
                if rarity == "Near_Miss_Epic":
                    # Epic 근처에서 실패 → Rare로 변환
                    actual_rarity = "Rare"
                    results.append(f"{actual_rarity}_near_miss_epic")
                elif rarity == "Near_Miss_Legendary":
                    # Legendary 근처에서 실패 → Epic으로 변환 (위로)
                    actual_rarity = "Epic"
                    results.append(f"{actual_rarity}_near_miss_legendary")
                else:
                    actual_rarity = "Common"
                    results.append(f"{actual_rarity}_near_miss")
                
                rarity = actual_rarity
            else:
                results.append(rarity)
                
                # 특별 애니메이션 타입 설정
                if rarity == "Legendary":
                    animation_type = "legendary"
                elif rarity == "Epic":
                    animation_type = "epic"
            
            # 보상 풀 관리
            if self.reward_pool:
                available = self.reward_pool.get(rarity, 0)
                if available <= 0:
                    rarity = "Common"
                else:
                    self.reward_pool[rarity] = available - 1
            
            # 히스토리 업데이트 (실제 획득 아이템 기록)
            actual_rarity = rarity.replace("_near_miss_epic", "").replace("_near_miss_legendary", "").replace("_near_miss", "")
            history.insert(0, actual_rarity)
            history = history[:10]

        # 가챠 카운트 업데이트
        self.repo.set_gacha_count(user_id, current_count)
        self.repo.set_gacha_history(user_id, history)

        # 심리적 메시지 생성
        psychological_message = self._generate_psychological_message(
            rarity=results[0] if results else "Common",
            near_miss=near_miss_occurred,
            consecutive_fails=consecutive_fails
        )

        balance = self.token_service.get_token_balance(user_id)
        self.repo.record_action(db, user_id, "GACHA_PULL", -cost)
        
        self.logger.debug(
            "User %s gacha results %s, balance %s, near_miss: %s", 
            user_id, results, balance, near_miss_occurred
        )
        
        return GachaPullResult(
            results=results,
            tokens_change=-cost,
            balance=balance,
            near_miss_occurred=near_miss_occurred,
            animation_type=animation_type,
            psychological_message=psychological_message
        )

    def get_user_gacha_stats(self, user_id: int) -> Dict[str, any]:
        """유저 가챠 통계 정보 반환"""
        current_count = self.repo.get_gacha_count(user_id)
        history = self.repo.get_gacha_history(user_id)
        
        # 각 등급별 획득 횟수 계산
        rarity_counts = {}
        for item in history:
            rarity_counts[item] = rarity_counts.get(item, 0) + 1
        
        return {
            "current_pity_count": current_count,
            "pulls_until_pity": max(0, 90 - current_count),
            "recent_history": history[:5],
            "rarity_counts": rarity_counts,
            "luck_score": self._calculate_luck_score(history)
        }
    
    def _calculate_luck_score(self, history: List[str]) -> str:
        """운 점수 계산 (심리적 피드백)"""
        if not history:
            return "보통"
        
        recent_5 = history[:5]
        legendary_count = recent_5.count("Legendary")
        epic_count = recent_5.count("Epic")
        
        if legendary_count >= 1:
            return "매우 좋음"
        elif epic_count >= 2:
            return "좋음"
        elif epic_count >= 1:
            return "보통"
        else:
            return "다음엔 더 좋을 거예요!"
