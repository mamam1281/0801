"use client";

import { useMemo } from 'react';
import { useGlobalStore } from '@/store/globalStore';
import {
  TOTAL_KEYS_GLOBAL,
  GAME_ID_ALIASES,
  PLAY_COUNT_KEYS_BY_GAME,
  BEST_SCORE_KEYS_BY_GAME,
} from '@/constants/gameStatsKeys';

type AnyObj = Record<string, any> | undefined | null;

function firstNumber(obj: AnyObj, keys: string[]): number {
  if (!obj) return 0;
  for (const k of keys) {
    const v = (obj as any)[k];
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
  }
  return 0;
}

function normalizeEntry(e: any): Record<string, any> | undefined {
  if (!e || typeof e !== 'object') return undefined;
  return 'data' in e && e.data && typeof e.data === 'object' ? e.data as any : (e as any);
}

export function useGlobalTotalGames(): number {
  const { state } = useGlobalStore();
  return useMemo(() => {
    const stats = state?.gameStats || {};
    const entries = Object.values(stats);
    if (!entries.length) return 0;
  return entries.reduce((acc: number, e: any) => acc + firstNumber(normalizeEntry(e), [...TOTAL_KEYS_GLOBAL]), 0 as number);
  }, [state?.gameStats]);
}

export function useGameTileStats(gameId: string, legacyUserGameStats?: AnyObj) {
  const { state } = useGlobalStore();
  return useMemo(() => {
    // 1) state.gameStats에서 해당 게임 id 또는 별칭을 탐색
    const all = state?.gameStats || {};
    const aliases = [gameId, ...(GAME_ID_ALIASES[gameId] || [])];
    let entry: AnyObj;
    for (const key of Object.keys(all)) {
      if (aliases.includes(key)) { entry = normalizeEntry((all as any)[key]); break; }
    }
    // 2) 플레이 카운트/베스트 스코어 키셋으로 숫자 추출
    const playKeys = PLAY_COUNT_KEYS_BY_GAME[gameId] || TOTAL_KEYS_GLOBAL as any;
    const bestKeys = BEST_SCORE_KEYS_BY_GAME[gameId] || [];
    const playCountFromStore = firstNumber(entry, playKeys);
    const bestScoreFromStore = firstNumber(entry, bestKeys);
    // 3) fallback: legacy user.gameStats
    const playCountLegacy = firstNumber(legacyUserGameStats, playKeys);
    const bestScoreLegacy = firstNumber(legacyUserGameStats, bestKeys);
    return {
      playCount: playCountFromStore || playCountLegacy || 0,
      bestScore: bestScoreFromStore || bestScoreLegacy || 0,
    };
  }, [state?.gameStats, gameId, legacyUserGameStats]);
}
