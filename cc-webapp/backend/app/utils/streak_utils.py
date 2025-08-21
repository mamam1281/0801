"""Streak 공통 유틸 함수.

다음 보상 문자열 산출 로직을 단일화하여 중복 구현을 제거한다.
"""
from __future__ import annotations

def calc_next_streak_reward(next_count: int) -> str:
    """next_count(다음 횟수)에 대해 표시할 보상 명칭.

    규칙:
    - 7의 배수: Epic Chest
    - 3의 배수: Rare Chest
    - 그 외: Coins + XP
    """
    if next_count % 7 == 0:
        return "Epic Chest"
    if next_count % 3 == 0:
        return "Rare Chest"
    return "Coins + XP"

__all__ = ["calc_next_streak_reward"]
