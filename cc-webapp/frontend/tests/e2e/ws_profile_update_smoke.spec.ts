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

  // 3) 화면 우측 상단 GOLD(하단바 quick view) 값 읽기 (안정적인 data-testid 사용)
  const goldQuick = page.getByTestId('gold-quick');
  // 최대 3초 대기: 초기 렌더/수치 반영 지연 흡수
  await goldQuick.waitFor({ state: 'visible', timeout: 3000 });
  const uiGoldText = (await goldQuick.innerText()).trim(); // e.g. "1,234G"
  const uiGoldNum = Number(uiGoldText.replace(/[^0-9.-]/g, '')) || 0;

  // 4) 간접 동기성 검증: API 수치와 UI 수치가 동일(혹은 await 직후 근사치)
  expect(uiGoldNum).toBe(goldFromApi);
  });
});
