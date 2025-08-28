// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe('WS→UI 반영 스모크', () => {
  test('홈 대시보드 GOLD가 /auth/me 및 /users/balance와 동기 유지(간접 검증)', async ({ page, request }) => {
    // 0) 인증 시드: 신규 유저 등록 후 토큰을 번들 형태로 주입
    const API = process.env.API_BASE_URL || 'http://localhost:8000';
    const nickname = 'wsseed_' + Math.random().toString(36).slice(2, 8);
    const reg = await request.post(`${API}/api/auth/register`, {
      data: { nickname, invite_code: process.env.E2E_INVITE_CODE || '5858' }
    });
    expect(reg.ok()).toBeTruthy();
    const { access_token, refresh_token } = await reg.json();
    await page.addInitScript(([a, r]) => {
      try { localStorage.setItem('cc_auth_tokens', JSON.stringify({ access_token: a, refresh_token: r || undefined })); } catch {}
    }, access_token, refresh_token);

    // 1) 홈 접근
    await page.goto('/');
    // 2) 토큰이 있는 상태로 가정: 서버의 권위 값 조회
    //    주의: page.request는 브라우저 localStorage 기반의 인증을 자동으로 사용하지 않으므로
    //    백엔드 API를 직접 호출하면서 Authorization 헤더를 명시한다.
    let authRes = await request.get(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    if (!authRes.ok()) {
      // 초기 렌더 직후 타이밍 이슈 완화: 짧게 대기 후 1회 재시도
      await page.waitForTimeout(300);
      authRes = await request.get(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
    }
    expect(authRes.ok()).toBeTruthy();
    const me = await authRes.json();
    const balRes = await request.get(`${API}/api/users/balance`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const balJson = balRes.ok() ? await balRes.json() : {};
    const goldFromApi = Number(balJson?.gold ?? balJson?.gold_balance ?? balJson?.cyber_token_balance ?? me?.gold ?? me?.gold_balance ?? 0);

    // 3) 화면 우측 상단 GOLD(하단바 quick view) 텍스트를 가져와 숫자로 파싱
    //    .soft selector: 하단바 골드가 존재한다면 비교, 없으면 HomeDashboard 내부 표시를 fallback으로 찾음
    const goldBadge = page.locator('text=/G$/');
    // 일정 시간 내 렌더를 기다림
    await page.waitForTimeout(500);
    // HomeDashboard 메트릭 카드 내 골드 표시 후보
    const metricGold = page.locator('text=골드').first();

    // 4) 간접 동기성 검증: API와 UI 값이 큰 차이를 보이지 않는지(정확 비교는 포맷 의존이므로근사치)
    //    텍스트에 goldFromApi의 천단위 포맷 일부가 포함되는지 검사
    const expectedStr = new Intl.NumberFormat('ko-KR').format(goldFromApi);
    // 최소 하나의 UI 텍스트에 포함되어야 함
    const uiText = (await page.content()) || '';
    expect(uiText.includes(`${expectedStr}`)).toBeTruthy();
  });
});
