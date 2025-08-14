import apiRequest from './api';

export type ActionPayload = {
  user_id: number;
  action_type: string;
  context?: Record<string, any>;
};

export async function postAction(payload: ActionPayload) {
  return await apiRequest('/api/actions', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function postActionsBatch(payloads: ActionPayload[]) {
  return await apiRequest('/api/actions/batch', {
    method: 'POST',
    body: JSON.stringify({ actions: payloads })
  });
}

export type ShopBuyPayload = {
  user_id: number;
  product_id: string;
  amount: number; // price in gems/tokens
  quantity?: number;
  metadata?: Record<string, any>;
};

export async function buyProduct(payload: ShopBuyPayload) {
  return await apiRequest('/api/shop/buy', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
