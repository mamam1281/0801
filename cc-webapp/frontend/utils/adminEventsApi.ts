import { api } from '@/lib/unifiedApi';

// 관리자 이벤트 관리 API 클라이언트
export const adminEventsApi = {
  list: async () => api.get('admin/events'),
  create: async (payload: any) => api.post('admin/events', payload),
  update: async (id: number, payload: any) => api.put(`admin/events/${id}`, payload),
  deactivate: async (id: number) => api.post(`admin/events/${id}/deactivate`, {}),
  participations: async (id: number) => api.get(`admin/events/${id}/participations`),
  forceClaim: async (id: number, userId: number) => api.post(`admin/events/${id}/force-claim/${userId}`, {}),
  seedModelIndex: async () => api.post('admin/events/seed/model-index', {}),
};

export default adminEventsApi;
