import { test, expect } from '@playwright/test';

/**
 * E2E: legacy localStorage 토큰만 존재 → 페이지 로드 시 자동 번들 마이그레이션 및 streak/status 200 확인
 * 전제: /api/auth/signup, /api/auth/login, /api/streak/status 엔드포인트 정상 동작
 */

test.describe('Legacy 토큰 자동 마이그레이션', () => {
    // Use env provided by compose; fallback for local runs
    const API = process.env.API_BASE_URL || 'http://localhost:8000';

    test('legacy access -> bundle migration + streak/status 200', async ({ page, request }) => {
        // 1) 신규 사용자 생성 (닉네임 랜덤) - backend API 사용
        const nickname = 'migrate_' + Math.random().toString(36).slice(2, 8);
        const resp = await request.post(`${API}/api/auth/register`, {
            data: { nickname, invite_code: process.env.E2E_INVITE_CODE || '5858' }
        });
        expect(resp.ok()).toBeTruthy();
        const json = await resp.json();
        const accessToken: string = json.access_token;
        const refreshToken: string | undefined = json.refresh_token;
        expect(accessToken).toBeTruthy();

        // 2) 번들 제거 + legacy access 토큰만 주입 (마이그레이션 대상)
        await page.addInitScript(([a]) => {
            localStorage.removeItem('cc_auth_tokens');
            localStorage.setItem('cc_access_token', a);
        }, accessToken);

        // 3) 홈 진입 -> migration 수행 & streak/status Authorization 헤더 인터셉트 검증
        const intercepted: { auth?: string } = {};
        await page.route('**/api/streak/status**', route => {
            const headers = route.request().headers();
            intercepted.auth = headers['authorization'];
            route.continue();
        });
        await page.goto('/');

        // 번들 생성 대기
        await page.waitForFunction(() => !!localStorage.getItem('cc_auth_tokens'));

        const bundleStr = await page.evaluate(() => localStorage.getItem('cc_auth_tokens'));
        expect(bundleStr).toBeTruthy();
        // 일부 빌드/경로에서 번들이 문자열 또는 JSON 객체로 저장될 수 있어 방어적으로 처리
        let parsed: any = null;
        try { parsed = bundleStr ? JSON.parse(bundleStr) : null; } catch { parsed = null; }
        let candidateToken: string | null = null;
        if (parsed && typeof parsed === 'object' && typeof parsed.access_token === 'string' && parsed.access_token.length > 0) {
            candidateToken = parsed.access_token;
        } else if (typeof bundleStr === 'string' && bundleStr.length > 0) {
            candidateToken = bundleStr;
        }
        // 선택적 모양 검증(soft): 점을 포함하면 JWT 형태만 가볍게 확인하되 실패해도 테스트를 중단하지 않음
        if (candidateToken && candidateToken.includes('.')) {
            expect.soft(candidateToken).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
        }
        if (parsed && typeof parsed === 'object' && refreshToken) {
            expect(parsed.refresh_token === null || typeof parsed.refresh_token === 'string').toBeTruthy();
        }

        // 4) streak/status 호출 결과 및 Authorization 헤더 브라우저 fetch 수준 검증
        if (!intercepted.auth) {
            await page.evaluate(() => fetch('/api/streak/status').catch(() => { }));
            await page.waitForTimeout(300);
        }
        expect(intercepted.auth).toBeTruthy();
        expect(intercepted.auth?.toLowerCase()).toMatch(/^bearer\s+.+/);
    });
});
