import React, { useState, useCallback } from 'react';
import { useApiClient } from './useApiClient';

interface FollowItem { user_id: number; nickname: string; followed_at: string; }
interface FollowListResponse { total: number; items: FollowItem[]; limit: number; offset: number; }
interface FollowActionResponse { success: boolean; following: boolean; target_user_id: number; follower_count: number; following_count: number; }

export function useFollowList(authToken: string | null) {
  const { call } = useApiClient('/api/games');
  const [list, setList] = useState(null as any);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null as any);

  const refresh = useCallback(async (limit = 20, offset = 0) => {
    setLoading(true); setError(null);
    try {
      const res = await (call as any)('/follow/list', { authToken, params: { limit, offset } }) as FollowListResponse;
      setList(res);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [authToken, call]);

  const follow = useCallback(async (targetUserId: number) => {
    try {
      await (call as any)(`/follow/${targetUserId}`, { method: 'POST', authToken }) as FollowActionResponse;
      await refresh();
    } catch (e: any) { setError(e.message); }
  }, [authToken, call, refresh]);

  const unfollow = useCallback(async (targetUserId: number) => {
    try {
      await (call as any)(`/follow/${targetUserId}`, { method: 'DELETE', authToken }) as FollowActionResponse;
      await refresh();
    } catch (e: any) { setError(e.message); }
  }, [authToken, call, refresh]);

  return { list, refresh, follow, unfollow, loading, error };
}
