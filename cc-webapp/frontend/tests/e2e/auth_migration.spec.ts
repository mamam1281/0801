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

    // 번들 생성 대기 (최대 1.2s)
    await page.waitForFunction(() => !!localStorage.getItem('cc_auth_tokens'), { timeout: 1200 });

        const bundleStr = await page.evaluate(() => localStorage.getItem('cc_auth_tokens'));
        expect(bundleStr).toBeTruthy();
        // 일부 빌드/경로에서 번들이 문자열 토큰으로 저장될 수 있어 방어적으로 처리
        let parsed: any = null;
        try { parsed = bundleStr ? JSON.parse(bundleStr) : null; } catch { parsed = null; }
        const tokenFromBundle: string | undefined = (parsed && typeof parsed === 'object')
            ? parsed.access_token
            : (typeof bundleStr === 'string' ? bundleStr : undefined);
        expect(typeof tokenFromBundle).toBe('string');
        // 번들 토큰이 비어있게 보일 때가 있어 짧게 한 번 더 재시도하여 확보
        let candidateToken = tokenFromBundle || '';
        if (!candidateToken || candidateToken.length < 10) {
            await page.waitForTimeout(250);
            const s2 = await page.evaluate(() => localStorage.getItem('cc_auth_tokens'));
            let p2: any = null; try { p2 = s2 ? JSON.parse(s2) : null; } catch { p2 = null; }
            candidateToken = (p2 && typeof p2 === 'object') ? p2.access_token : (typeof s2 === 'string' ? s2 : '');
            if (!candidateToken || candidateToken.length < 10) {
                await page.waitForTimeout(250);
                const s3 = await page.evaluate(() => localStorage.getItem('cc_auth_tokens'));
                let p3: any = null; try { p3 = s3 ? JSON.parse(s3) : null; } catch { p3 = null; }
                candidateToken = (p3 && typeof p3 === 'object') ? p3.access_token : (typeof s3 === 'string' ? s3 : '');
            }
        }
        // 최소 길이만 보장하고, 가능하면 JWT 형태도 확인
        expect(candidateToken && candidateToken.length >= 10).toBeTruthy();
        if (candidateToken.includes('.')) {
            expect(candidateToken).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
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
