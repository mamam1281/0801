import { apiGet } from '@/lib/simpleApi';

// 관리자 관련 API thin wrapper
export const adminApi = {
  getCoreStats: () => apiGet('/api/admin/core-stats'),
  listUsers: (params?: { page?: number; size?: number }) => apiGet('/api/admin/users', { params }),
};
