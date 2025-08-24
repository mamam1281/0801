import { useMemo } from 'react';
import { useRealtimeSync } from '../contexts/RealtimeSyncContext';

// 공용 셀렉터 훅: RealtimeSyncContext를 단일 소스로 사용
export function useGold(): number {
  const { state } = useRealtimeSync();
  return state.profile?.gold ?? 0;
}

export function useStats<T = any>(gameType?: string): T | Record<string, any> | undefined {
  const { state } = useRealtimeSync();
  return useMemo(() => {
    if (!state?.stats) return undefined;
    if (!gameType) return state.stats;
    return state.stats[gameType]?.data as T | undefined;
  }, [state, gameType]);
}

// 순수 함수 셀렉터 (테스트/비훅 환경용)
export const selectGold = (state: { profile?: { gold?: number } } | undefined | null): number => {
  return state?.profile?.gold ?? 0;
};
