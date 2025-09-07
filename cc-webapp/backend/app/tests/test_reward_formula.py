import math
from app.services.reward_service import calculate_streak_daily_reward

# 1일차부터 시작하는 선형 증가 공식 테스트
# Gold = 800 + (streak_count * 200), XP = 25 + (streak_count * 25)
# 최대: 2800골드, 275XP

def test_streak_reward_linear_progression():
    """1일차부터 시작하는 선형 증가 테스트"""
    
    # 1일차: 1000골드, 50XP
    g1, x1 = calculate_streak_daily_reward(1)
    assert g1 == 1000
    assert x1 == 50
    
    # 2일차: 1200골드, 75XP
    g2, x2 = calculate_streak_daily_reward(2)
    assert g2 == 1200
    assert x2 == 75
    
    # 3일차: 1400골드, 100XP
    g3, x3 = calculate_streak_daily_reward(3)
    assert g3 == 1400
    assert x3 == 100
    
    # 10일차: 2800골드, 275XP (최대값)
    g10, x10 = calculate_streak_daily_reward(10)
    assert g10 == 2800
    assert x10 == 275


def test_streak_reward_monotonic_increase():
    """연속일이 증가할수록 보상도 증가하는지 테스트"""
    prev_g = 0
    prev_x = 0
    
    for s in range(1, 11):  # 1일차부터 10일차까지
        g, x = calculate_streak_daily_reward(s)
        assert g > prev_g, f"Day {s}: gold should increase"
        assert x > prev_x, f"Day {s}: xp should increase"
        prev_g, prev_x = g, x


def test_streak_reward_max_cap():
    """최대 보상 제한 테스트"""
    # 10일차 이후는 최대값으로 고정
    g15, x15 = calculate_streak_daily_reward(15)
    g20, x20 = calculate_streak_daily_reward(20)
    
    assert g15 == 2800  # 최대 골드
    assert x15 == 275   # 최대 XP
    assert g20 == 2800  # 15일차와 동일
    assert x20 == 275   # 15일차와 동일
