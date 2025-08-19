"""Centralized casino economy parameters (Economy V2 flag gated).

NOTE: 모든 게임/상점/가챠/보상 수학적 파라미터는 여기에서만 정의.
Feature Flag: ECONOMY_V2_ACTIVE (환경변수 또는 settings 통해 노출 예정)

Stage1: 값 정의만, 실제 게임 서비스 로직은 아직 기존 동작 유지 (플래그 켜기 전 안전)
"""
from __future__ import annotations

# Feature Flag 이름 (settings.ECONOMY_V2_ACTIVE 로 접근 예상)
ECONOMY_V2_FLAG_NAME = "ECONOMY_V2_ACTIVE"

# ----- RTP / Edge Targets -----
SLOT_RTP_TARGET = 0.92  # House edge 8%
RPS_HOUSE_EDGE = 0.05   # Win 배당 = 2 * (1 - edge/ (기초 모형) -> 1.90 근사)
CRASH_HOUSE_EDGE = 0.07 # 최종 multiplier 보정 또는 bust 확률 상향

# ----- Gacha Costs -----
GACHA_BASE_COST_SINGLE = 500
GACHA_BASE_COST_MULTI10 = 4800  # 약 4% 할인

# ----- Gacha Probabilities (합=1.0) -----
GACHA_RARITY_PROBS = {
    "common": 0.82,
    "rare": 0.135,
    "epic": 0.04,
    "legendary": 0.005,
}

# ----- Gacha Assigned Gold Values (직접 gold 지급 유지 1차) -----
# 기대가치(EV) ~ Σ p_i * value_i ≈ 0.56 * 단일 비용 (sink 유지)
GACHA_RARITY_VALUES = {
    "common": 50,
    "rare": 250,
    "epic": 1200,
    "legendary": 7000,
}

# ----- RPS -----
# 승리 시 배당 (사용자 payout multiplier)
RPS_PAYOUT_MULTIPLIER = 1.90

# ----- Slot Symbols (V2) -----
SLOT_SYMBOL_WEIGHTS_V2 = {  # 빈도 (낮을수록 희귀)
    "🍒": 35,
    "🍋": 28,
    "🍊": 18,
    "🍇": 12,
    "💎": 5,
    "7️⃣": 2,
}
SLOT_SYMBOL_MULTIPLIERS_V2 = {  # 3-of-a-kind base multiplier
    "🍒": 2,
    "🍋": 3,
    "🍊": 5,
    "🍇": 8,
    "💎": 15,
    "7️⃣": 40,
}
# 2개 매치 보상 (bet * 이 값). RTP 맞추기 위해 낮게 유지.
SLOT_TWO_MATCH_MULTIPLIER_V2 = 1.4

# 보너스/랜덤 변동 제거(안정적 RTP) → 변동 기능 제거 시 True
SLOT_DISABLE_STREAK_BONUS = True
SLOT_DISABLE_RANDOM_VARIATION = True

# ----- Crash (네온 크래쉬) -----
# 간단 구현: 계산된 최종 multiplier * (1 - CRASH_HOUSE_EDGE_ADJUST)
CRASH_HOUSE_EDGE_ADJUST = CRASH_HOUSE_EDGE  # alias

# ----- Helper Functions (선택적) -----

def is_v2_active(settings) -> bool:
    """settings 객체에서 ECONOMY_V2_ACTIVE 해석.
    settings.ECONOMY_V2_ACTIVE 가 존재하고 True 로 평가되면 V2 활성.
    """
    return bool(getattr(settings, ECONOMY_V2_FLAG_NAME, False))
