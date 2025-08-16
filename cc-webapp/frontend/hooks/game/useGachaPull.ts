import { useState, useCallback } from 'react';
import { useApiClient } from './useApiClient';

interface GachaResultItem { rarity: string; amount: number; reward_type?: string; }
interface GachaPullResponse { success: boolean; cost: number; items: GachaResultItem[]; pity_counter?: number; }

export function useGachaPull(authToken: string | null) {
  const { call } = useApiClient('/api/games/gacha');
  const [lastResult, setLastResult] = useState<GachaPullResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pull = useCallback(async (count: 1 | 10 = 1) => {
    setLoading(true); setError(null);
    try {
        const res = await call<GachaPullResponse>('/pull', { method: 'POST', authToken, body: { count } });
      setLastResult(res);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [authToken, call]);

  return { pull, lastResult, loading, error };
}
