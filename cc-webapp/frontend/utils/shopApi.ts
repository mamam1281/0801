import { api } from '../lib/unifiedApi';

// Minimal types aligned with backend OpenAPI (lenient to avoid build breaks)
export interface CatalogItem {
	id: number | string;
	sku: string;
	name: string;
	price_cents?: number;
	discounted_price_cents?: number | null;
	gold?: number; // unified currency (aka gems)
	gems?: number | null; // deprecated alias
	discount_percent?: number | null;
	discount_ends_at?: string | null;
	min_rank?: string | null;
}

export interface BuyRequest {
	product_id: number | string;
	quantity?: number; // default 1
	kind?: 'gold' | 'item';
	idempotency_key?: string;
	// optional pass-throughs (backend may ignore if not needed)
	amount_cents?: number;
	payment_method?: string;
}

export interface BuyReceipt {
	status: 'success' | 'pending' | 'failed' | 'idempotent_reuse';
	receipt_code?: string;
	product_id?: number | string;
	amount_cents?: number;
	reason_code?: string;
}

export const shopApi = {
	listCatalog: () => api.get<CatalogItem[]>('shop/catalog'),
	buy: (payload: BuyRequest) => api.post<BuyReceipt>('shop/buy', payload),
};

