import apiRequest from './apiClient';

// 관리자 이벤트 관리 API 클라이언트
export const adminEventsApi = {
  list: async () => apiRequest('/api/admin/events'),
  create: async (payload: any) => apiRequest('/api/admin/events', { method: 'POST', body: JSON.stringify(payload) }),
  update: async (id: number, payload: any) => apiRequest(`/api/admin/events/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deactivate: async (id: number) => apiRequest(`/api/admin/events/${id}/deactivate`, { method: 'POST', body: JSON.stringify({}) }),
  participations: async (id: number) => apiRequest(`/api/admin/events/${id}/participations`),
  forceClaim: async (id: number, userId: number) => apiRequest(`/api/admin/events/${id}/force-claim/${userId}`, { method: 'POST', body: JSON.stringify({}) }),
  seedModelIndex: async () => apiRequest('/api/admin/events/seed/model-index', { method: 'POST', body: JSON.stringify({}) }),
};

export default adminEventsApi;
