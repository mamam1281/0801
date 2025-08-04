import { useState, useEffect, useCallback } from 'react';
import { adminApiService } from '../services/adminApi';
import { User, UserDetailResponse, UserActivity, GiveRewardRequest, PaginatedResponse } from '../types/admin';

// 사용자 목록 조회 훅
export const useUsers = (params?: {
  skip?: number;
  limit?: number;
  search?: string;
}) => {
  const [data, setData] = useState<PaginatedResponse<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminApiService.getUsers(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '사용자 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [params?.skip, params?.limit, params?.search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { data, loading, error, refetch: fetchUsers };
};

// 사용자 상세 정보 조회 훅
export const useUserDetail = (userId: number | null) => {
  const [data, setData] = useState<UserDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserDetail = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      const result = await adminApiService.getUserDetail(userId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '사용자 정보를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUserDetail();
    }
  }, [fetchUserDetail]);

  return { data, loading, error, refetch: fetchUserDetail };
};

// 활동 목록 조회 훅
export const useActivities = (params?: {
  skip?: number;
  limit?: number;
  user_id?: number;
}) => {
  const [data, setData] = useState<PaginatedResponse<UserActivity> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminApiService.getActivities(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '활동 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [params?.skip, params?.limit, params?.user_id]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return { data, loading, error, refetch: fetchActivities };
};

// 대시보드 통계 조회 훅
export const useDashboardStats = () => {
  const [data, setData] = useState<{
    totalUsers: number;
    activeUsers: number;
    totalRewards: number;
    todayActivities: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminApiService.getDashboardStats();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '통계 데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    
    // 30초마다 자동 갱신
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { data, loading, error, refetch: fetchStats };
};

// 보상 지급 훅
export const useGiveReward = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const giveReward = useCallback(async (rewardData: GiveRewardRequest) => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminApiService.giveReward(rewardData);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '보상 지급에 실패했습니다';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { giveReward, loading, error };
};
