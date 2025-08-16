import { useState, useCallback } from 'react';
import { useApiClient } from './useApiClient';

type RpsHand = 'rock' | 'paper' | 'scissors';
interface RpsPlayResponse { result: 'win' | 'lose' | 'draw'; player_hand: RpsHand; opponent_hand: RpsHand; delta_coin: number; }

export function useRpsPlay(authToken: string | null) {
  const { call } = useApiClient('/api/games/rps');
  const [last, setLast] = useState<RpsPlayResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const play = useCallback(async (hand: RpsHand) => {
    setLoading(true); setError(null);
    try {
        const res = await call<RpsPlayResponse>('/play', { method: 'POST', authToken, body: { hand } });
      setLast(res);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [authToken, call]);

  return { play, last, loading, error };
}
