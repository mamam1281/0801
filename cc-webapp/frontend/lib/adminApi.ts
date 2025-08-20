// simpleApi 모듈을 상대 경로로 직접 import (paths alias 인식 문제 대응)
import { apiGet } from './simpleApi';

// 관리자 관련 API thin wrapper
// 백엔드 실제 엔드포인트는 /api/admin/stats (core-stats 아님)
export const adminApi = {
  getCoreStats: () => apiGet('/api/admin/stats'),
  listUsers: (params?: { page?: number; size?: number }) => apiGet('/api/admin/users', { params }),
};
