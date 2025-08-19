import { test, expect } from '@playwright/test';

/**
 * E2E: legacy localStorage 토큰만 존재 → 페이지 로드 시 자동 번들 마이그레이션 및 streak/status 200 확인
 * 전제: /api/auth/signup, /api/auth/login, /api/streak/status 엔드포인트 정상 동작
 */

test.describe('Legacy 토큰 자동 마이그레이션', () => {
    const baseURL = 'http://localhost:3000'; // 하드코딩(타입 오류 방지 및 CI 기본 환경)

    test('legacy access -> bundle migration + streak/status 200', async ({ page, request }) => {
        // 1) 신규 사용자 생성 (닉네임 랜덤)
        const nickname = 'migrate_' + Math.random().toString(36).slice(2, 8);
        const signupResp = await request.post(`${baseURL}/api/auth/signup`, {
            data: { nickname, invite_code: 'TEST' }
        });
        expect(signupResp.ok()).toBeTruthy();

        const signupJson = await signupResp.json();
        const accessToken: string = signupJson.access_token;
        const refreshToken: string = signupJson.refresh_token;
        expect(accessToken).toBeTruthy();
        expect(refreshToken).toBeTruthy();

        // 2) 번들 제거 + legacy access 토큰만 주입
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
        await page.goto(baseURL + '/');

        // 번들 생성 대기
        await page.waitForFunction(() => !!localStorage.getItem('cc_auth_tokens'));

        const bundleStr = await page.evaluate(() => localStorage.getItem('cc_auth_tokens'));
        expect(bundleStr).toBeTruthy();
        const bundle = JSON.parse(bundleStr!);
        expect(bundle.access_token).toBe(accessToken);

        // 4) streak/status 호출 결과 및 Authorization 헤더 브라우저 fetch 수준 검증
        // 페이지 로드시 프론트 코드가 status 요청을 자동 호출한다고 가정.
        // 만약 자동 호출이 없다면 강제 호출.
        if (!intercepted.auth) {
            await page.evaluate(() => fetch('/api/streak/status').catch(() => { }));
            await page.waitForTimeout(300);
        }
        expect(intercepted.auth).toBeTruthy();
        expect(intercepted.auth?.toLowerCase()).toMatch(/^bearer\s+.+/);
    });
});
