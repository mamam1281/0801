import { api } from '@/lib/unifiedApi';

// OpenAPI 기준 관리자 상점 타입 (요약)
export interface AdminCatalogItemIn {
  id: number;
  sku: string;
  name: string;
  price_cents: number; // 실제 결제 금액(센트)
  gold: number;        // 지급될 골드(구 gems)
  discount_percent?: number; // 0~100
  discount_ends_at?: string | null; // ISO datetime
  min_rank?: string | null;         // 최소 요구 랭크
}

export interface AdminCatalogItemOut extends AdminCatalogItemIn {
  gems?: number | null; // DEPRECATED alias
}

// 관리자 관련 API thin wrapper
// 백엔드 실제 엔드포인트는 /api/admin/** (core-stats 아님)
export const adminApi = {
  // Stats & Users
  getCoreStats: () => api.get('admin/stats'),
  listUsers: (params?: { page?: number; size?: number }) =>
    api.get(
      `admin/users$${''}`.replace('$', '') +
        (params?.page !== undefined || params?.size !== undefined
          ? `?${new URLSearchParams({
              page: String(params?.page ?? ''),
              size: String(params?.size ?? ''),
            }).toString()}`
          : '')
    ),

  // Shop (Admin)
  listShopItems: () => api.get<AdminCatalogItemOut[]>('admin/shop/items'),
  createShopItem: (data: AdminCatalogItemIn) => api.post<AdminCatalogItemOut>('admin/shop/items', data),
  updateShopItem: (itemId: number, data: AdminCatalogItemIn) =>
    api.put<AdminCatalogItemOut>(`admin/shop/items/${itemId}`, data),
  deleteShopItem: (itemId: number) => api.del<void>(`admin/shop/items/${itemId}`),
  setDiscount: (itemId: number, patch: { discount_percent: number; discount_ends_at?: string | null }) =>
    api.post<AdminCatalogItemOut>(`admin/shop/items/${itemId}/discount`, patch, { method: 'PATCH' }),
  setRank: (itemId: number, patch: { min_rank: string | null }) =>
    api.post<AdminCatalogItemOut>(`admin/shop/items/${itemId}/rank`, patch, { method: 'PATCH' }),
};
