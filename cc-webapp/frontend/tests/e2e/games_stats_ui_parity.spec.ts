import { test, expect, request } from '@playwright/test';

// UI 합계 = /api/games/stats/me 파리티 스펙 (가드 포함)
// 실행 조건: E2E_REQUIRE_STATS_PARITY=1 이고, /api/games/stats/me 가 200일 때만

const API = process.env.API_BASE_URL || 'http://localhost:8000';
const REQUIRE = process.env.E2E_REQUIRE_STATS_PARITY === '1';

async function apiSignup(ctx: any) {
    const nonce = Date.now().toString(36);
    const nickname = `ui_parity_${nonce}`;
    const site_id = `ui_parity_${nonce}`;
    const password = 'password123';
    const phone_number = '010-0000-0000';
    const invite = process.env.E2E_INVITE_CODE || '5858';
    // Backend 요구 스키마: invite_code, nickname, site_id, phone_number, password
    const res = await ctx.post(`${API}/api/auth/signup`, {
        data: { invite_code: invite, nickname, site_id, phone_number, password },
    });
    if (!res.ok()) return null;
    try { return await res.json(); } catch { return null; }
}

async function ensureSomeGameActions(page: import('@playwright/test').Page, ctx: any, accessToken: string) {
    // 시도: RPS 클릭 1회, Crash 짧은 러닝, Gacha 1회 API 호출
    // 환경/라우팅에 따라 존재하지 않을 수 있으므로 전부 best-effort로 시도하고 실패해도 계속 진행
    // 1) RPS
    try {
        const rpsLink = page.getByRole('link', { name: /가위바위보|RPS/i }).first();
        if (await rpsLink.count() > 0 && await rpsLink.isVisible()) {
            await rpsLink.click();
            const rpsButtons = page.locator('button:has-text("\u270a"), button:has-text("\u270b"), button:has-text("\u270c")');
            if (await rpsButtons.count() > 0) {
                await rpsButtons.first().click({ trial: true }).catch(() => { });
                await rpsButtons.first().click().catch(() => { });
                await page.waitForTimeout(500);
            }
        }
    } catch { }

    // 2) Crash
    try {
        const crashLink = page.getByRole('link', { name: /크래시|Crash/i }).first();
        if (await crashLink.count() > 0 && await crashLink.isVisible()) {
            await crashLink.click();
            const startBtn = page.getByRole('button', { name: /게임 시작|Start/i }).first();
            if (await startBtn.count() > 0 && await startBtn.isVisible()) {
                await startBtn.click().catch(() => { });
                await page.waitForTimeout(600);
                const cashoutBtn = page.getByRole('button', { name: /캐시아웃|Cashout/i }).first();
                if (await cashoutBtn.count() > 0 && await cashoutBtn.isVisible()) {
                    await cashoutBtn.click({ trial: true }).catch(() => { });
                    await cashoutBtn.click().catch(() => { });
                    await page.waitForTimeout(300);
                }
            }
        }
    } catch { }

    // 3) Gacha via API
    try {
        await ctx.post(`${API}/api/gacha/pull`, { headers: { Authorization: `Bearer ${accessToken}` } }).catch(() => null);
    } catch { }
}

async function fetchServerStats(ctx: any, token: string) {
    const res = await ctx.get(`${API}/api/games/stats/me`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
    if (!res || !res.ok()) return null;
    try { return await res.json(); } catch { return null; }
}

function extractServerTotal(server: any): number | null {
    if (!server || typeof server !== 'object') return null;
    const pick = (obj: any): number | null => {
        const cands = [obj?.total, obj?.total_actions, obj?.actions, obj?.sum].filter((v) => typeof v === 'number');
        if (cands.length > 0) return Number(cands[0]);
        // 히유리스틱: 키 이름에 total/actions/plays/pulls/rounds 포함된 숫자 합산
        let sum = 0;
        let found = 0;
        for (const [k, v] of Object.entries(obj)) {
            if (typeof v === 'number' && /(total|actions|plays|pulls|rounds)/i.test(k)) {
                sum += Number(v);
                found++;
            }
        }
        return found > 0 ? sum : null;
    };
    // 루트 → 래핑(stats/data) 순으로 탐색
    const root = pick(server);
    if (root != null) return root;
    const nested = server?.stats || server?.data || null;
    if (nested && typeof nested === 'object') {
        const n = pick(nested);
        if (n != null) return n;
    }
    return null;
}

async function readUiTotal(page: import('@playwright/test').Page): Promise<number | null> {
    // 우선순위 셀렉터: 명시적 testid → 대체 testid → 텍스트 패턴
    const trySelectors = [
        '[data-testid="stats-total"]',
        '[data-testid="stats-total-actions"]',
    '[data-testid="stats-total-games"]',
        '[data-testid="games-stats-total"]',
    ];
    for (const sel of trySelectors) {
        const el = page.locator(sel).first();
        // 렌더레이스 완화: 최대 2초 대기 후 판정
        if (await el.count() > 0) {
            await el.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {});
        }
        if (await el.count() > 0 && await el.isVisible().catch(() => false)) {
            const txt = await el.textContent().catch(() => '');
            const n = Number((txt || '').replace(/[^0-9.-]/g, ''));
            if (!Number.isNaN(n)) return n;
        }
    }
    // 텍스트 패턴: "총 플레이" 또는 "Total" 등에서 숫자 추출
    const candidate = page.locator('text=/총\s*플레이|Total\s*Actions/i').first();
    if (await candidate.count().catch(() => 0) > 0) {
        const txt = await candidate.textContent().catch(() => '');
        const m = (txt || '').match(/([0-9][0-9,\.]*)/);
        if (m) {
            const n = Number(m[1].replace(/[^0-9.-]/g, ''));
            if (!Number.isNaN(n)) return n;
        }
    }
    return null;
}

test('[Games] UI total equals /games/stats/me (guarded)', async ({ page }: { page: import('@playwright/test').Page }) => {
    // 가드: 환경 변수 필요
    test.skip(process.env.E2E_REQUIRE_STATS_PARITY !== '1', 'E2E_REQUIRE_STATS_PARITY!=1');

    const ctx = await request.newContext();
    const reg = await apiSignup(ctx);
    test.skip(!reg?.access_token, 'register failed');
    const token: string = reg.access_token;

    // 엔드포인트 가용성 체크
    const probe = await ctx.get(`${API}/api/games/stats/me`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
    test.skip(!probe || !probe.ok(), `stats endpoint unavailable: ${probe ? probe.status() : 'no-resp'}`);

    // 브라우저에 토큰 주입하여 로그인 상태로 진입
    const refreshToken = (reg as any)?.refresh_token || token;
    await page.addInitScript(([bundle, legacy]: [{ access_token: string; refresh_token?: string | null }, string]) => {
        try {
            localStorage.setItem('cc_auth_tokens', JSON.stringify(bundle));
            localStorage.setItem('cc_access_token', legacy);
        } catch {}
    }, [{ access_token: token, refresh_token: refreshToken }, token]);

    // 앱 진입 후 게임 액션 유도
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(200);
    // 홈 대시보드에 합계가 노출되는 경우를 대비해 사전 대기
    await page.locator('[data-testid="games-stats-total"]').first().waitFor({ state: 'visible', timeout: 2000 }).catch(() => {});
    await ensureSomeGameActions(page, ctx, token);

    // 서버 합계 조회
    const server = await fetchServerStats(ctx, token);
    test.skip(!server || typeof server !== 'object', 'no server stats');
    const extracted = extractServerTotal(server);
    test.skip(extracted == null, 'no numeric total in server stats');
    const serverTotal: number = Number(extracted);

    // 대시보드/프로필에서 UI 합계 추출 시도
    // 홈에 노출되지 않으면 내비 버튼으로 이동 시도
    const toDashboard = page.getByRole('link', { name: /대시보드|Dashboard|게임 센터|Game Center/i }).first();
    if (await toDashboard.count().catch(() => 0) > 0 && await toDashboard.isVisible().catch(() => false)) {
        await toDashboard.click().catch(() => { });
        await page.waitForTimeout(200);
    }
    let uiTotal = await readUiTotal(page);
    if (uiTotal == null) {
        // 폴백: 프로필 테스트 라우트 → 일반 프로필 라우트 순서로 이동하여 시도
        await page.goto('/e2e/profile').catch(() => {});
        await page.waitForTimeout(200);
        uiTotal = await readUiTotal(page);
    }
    if (uiTotal == null) {
        await page.goto('/profile').catch(() => {});
        await page.waitForTimeout(200);
        uiTotal = await readUiTotal(page);
    }
    if (uiTotal == null) {
        if (REQUIRE) {
            throw new Error('no UI total testid/text detected');
        }
        test.skip(true, 'no UI total testid/text detected');
        return;
    }

    expect(typeof uiTotal).toBe('number');
    expect(uiTotal).toBe(serverTotal);
});
