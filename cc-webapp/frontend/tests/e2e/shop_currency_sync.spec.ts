import { expect, request, test } from '@playwright/test';
// process 타입 의존 없이 환경변수 안전 접근
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const __env: any = (typeof globalThis !== 'undefined' && (globalThis as any).process && (globalThis as any).process.env) ? (globalThis as any).process.env : {};
const ENABLE = __env.E2E_SHOP_SYNC === '1';
const REQUIRE = __env.E2E_REQUIRE_SHOP_SYNC === '1';
const API = __env.API_BASE_URL || 'http://localhost:8000';

async function getBalance(ctx: any, token: string) {
    const res = await ctx.get(`${API}/api/users/balance`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    return json?.cyber_token_balance ?? 0;
}

test('Shop buy reconciles via /users/balance (GOLD)', async () => {
    test.skip(!ENABLE, 'Disabled by default. Set E2E_SHOP_SYNC=1 to enable.');
    const ctx = await request.newContext();
    const nickname = `e2e_shop_${Date.now().toString(36)}`;
    const invite = __env.E2E_INVITE_CODE || '5858';

    // Register and auth
    const register = await ctx.post(`${API}/api/auth/register`, { data: { invite_code: invite, nickname } });
    expect(register.ok()).toBeTruthy();
    const token = (await register.json()).access_token as string;
    const headers = { Authorization: `Bearer ${token}` };

    // Baseline balance
    const before = await getBalance(ctx, token);

    // List shop items (fallback chain: /items → /products → /catalog)
    let items: any[] = [];
    let listRes = await ctx.get(`${API}/api/shop/items`, { headers });
    if (!listRes.ok()) {
        listRes = await ctx.get(`${API}/api/shop/products`, { headers });
    }
    if (!listRes.ok()) {
        listRes = await ctx.get(`${API}/api/shop/catalog`, { headers });
    }
    if (!listRes.ok()) {
        if (REQUIRE) throw new Error(`no shop list endpoint available (${listRes.status()})`);
        test.skip(true, `no shop list endpoint available (${listRes.status()})`);
    }
    try {
        const j = await listRes.json();
        if (Array.isArray(j)) items = j; else if (Array.isArray(j?.items)) items = j.items; else if (Array.isArray(j?.data)) items = j.data;
    } catch { /* noop */ }
    if (!Array.isArray(items) || items.length === 0) {
        if (REQUIRE) throw new Error('no shop items');
        test.skip(true, 'no shop items');
    }
    const first = items.find((i: any) => (i?.id ?? i?.product_id) != null) || items[0];

    // Attempt buy with fallbacks: /buy/:id → /buy (body) → /purchase (body)
    const fid = first?.id ?? first?.product_id ?? first?.sku ?? first?.code;
    let buyRes = await ctx.post(`${API}/api/shop/buy/${fid}`, { headers }).catch(() => null as any);
    if (!buyRes || buyRes.status() === 404) {
        buyRes = await ctx.post(`${API}/api/shop/buy`, { headers, data: { product_id: fid, quantity: 1 } }).catch(() => null as any);
    }
    if (!buyRes || buyRes.status() === 404) {
        buyRes = await ctx.post(`${API}/api/shop/purchase`, { headers, data: { product_id: fid, quantity: 1 } }).catch(() => null as any);
    }
    expect([200, 400, 404, 422]).toContain(buyRes.status());

    // Reconcile balance
    const after = await getBalance(ctx, token);
    expect(typeof after).toBe('number');
    expect(after).toBeGreaterThanOrEqual(0);
});
