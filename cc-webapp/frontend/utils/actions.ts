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
  // E2E 결정론 강화를 위한 1회 실패 모킹: /?e2eFail=once 쿼리 사용 (production 제외)
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    try {
      const params = new URLSearchParams(window.location.search);
      const flag = params.get('e2eFail');
      const done = sessionStorage.getItem('e2eFailOnceDone') === '1';
      if (flag === 'once' && !done) {
        sessionStorage.setItem('e2eFailOnceDone', '1');
        // 약간의 지연 후 실패
        await new Promise((r) => setTimeout(r, 50));
        throw new Error('구매 요청 중 오류가 발생했습니다. (E2E 모킹)');
      }
    } catch (_) {
      // 쿼리 파싱 실패 등은 무시하고 실제 호출 진행
    }
  }

  return await apiRequest('/api/shop/buy', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
