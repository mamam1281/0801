import { useState, useCallback } from 'react';
import { useApiClient } from './useApiClient';

interface GameSession {
  session_id: string;
  started_at: string;
  active: boolean;
}

export function useGameSession(authToken: string | null) {
  const { call } = useApiClient('/api/games');
  const [session, setSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setLoading(true); setError(null);
    try {
        const s = await call<GameSession>('/session/start', { method: 'POST', authToken });
      setSession(s);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [authToken, call]);

  const end = useCallback(async () => {
    if (!session) return;
    setLoading(true); setError(null);
    try {
      await call('/session/end', { method: 'POST', authToken });
      setSession(null);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [authToken, call, session]);

  return { session, start, end, loading, error };
}
