import { useState, useCallback } from 'react';
import { useApiClient } from './useApiClient';

interface GachaResultItem { rarity: string; amount: number; reward_type?: string; }
interface GachaPullResponse { success: boolean; cost: number; items: GachaResultItem[]; pity_counter?: number; }

export function useGachaPull(authToken: string | null) {
  // Use generic base to avoid double /api/games/gacha when passing absolute path below
  const { call } = useApiClient('/api');
  const [lastResult, setLastResult] = useState<GachaPullResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pull = useCallback(async (count: 1 | 10 = 1) => {
    setLoading(true); setError(null);
    try {
      // Backend expects field name pull_count at /api/games/gacha/pull
      const res = await call('/games/gacha/pull', { method: 'POST', authToken, body: { pull_count: count } }) as GachaPullResponse;
      setLastResult(res);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [authToken, call]);

  return { pull, lastResult, loading, error };
}
