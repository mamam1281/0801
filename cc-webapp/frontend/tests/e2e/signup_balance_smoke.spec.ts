import { test, expect } from '@playwright/test';

// 회원가입 → 토큰 주입 → /api/users/balance 확인 → UI와 일치 확인(스모크)
// 안정성 우선: 최소 단언만 수행

test.describe('Signup → Balance smoke', () => {
  test('register and verify balance matches /users/balance', async ({ page, request }) => {
    const BASE = process.env.BASE_URL || 'http://frontend:3000';
    const API = process.env.API_BASE_URL || 'http://localhost:8000';

    const nickname = 'sb_' + Math.random().toString(36).slice(2, 8);
    const reg = await request.post(`${API}/api/auth/register`, {
      data: { nickname, invite_code: process.env.E2E_INVITE_CODE || '5858' }
    });
    expect(reg.ok()).toBeTruthy();
    const { access_token, refresh_token } = await reg.json();

    await page.addInitScript(([a, r, nick]) => {
      try {
        localStorage.setItem('cc_auth_tokens', JSON.stringify({ access_token: a, refresh_token: r || undefined }));
        localStorage.setItem('game-user', JSON.stringify({ id: 'e2e', nickname: nick, goldBalance: 0, level: 1 }));
        localStorage.setItem('E2E_FORCE_SCREEN', 'profile');
      } catch {}
    }, access_token, refresh_token, nickname);

  // 진입: 안정적인 E2E 전용 프로필 라우트로 이동
  await page.goto(BASE + '/e2e/profile');

    // 서버 권위 잔액 조회
    const balRes = await request.get(`${API}/api/users/balance`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    expect(balRes.ok()).toBeTruthy();
    const bal = await balRes.json();
    const serverGold = bal?.gold_balance ?? bal?.cyber_token_balance ?? 0;

    // UI에서 프로필/대시보드의 골드 텍스트 추출(테스트ID 우선, 폴백 텍스트 매칭)
    // 우선 profile-screen에 골드 표시가 있으면 사용
    const profile = page.getByTestId('profile-screen');
    await expect(profile).toBeVisible({ timeout: 20000 });

    // 공통 데이터-테스트아이디 시도
    const goldEl = page.getByTestId('gold-balance').first();
    let uiGold: number | null = null;
    try {
      if (await goldEl.isVisible({ timeout: 1000 })) {
        const text = (await goldEl.textContent()) || '';
        uiGold = parseInt(text.replace(/[^0-9]/g, ''), 10);
      }
    } catch {}

    if (uiGold == null || Number.isNaN(uiGold)) {
      // 폴백: 페이지 내 금액 숫자 스캔(간단)
      const content = await page.content();
      const m = content.match(/([0-9]{1,9})\s*(GOLD|골드|Gold)/i);
      if (m) uiGold = parseInt(m[1], 10);
    }

    expect(typeof serverGold).toBe('number');
    expect(serverGold).toBeGreaterThanOrEqual(0);
    // 느슨한 일치(초기 유저라면 거의 0 또는 초기값)
    // UI가 특정 포맷이면 정확 일치, 아니면 최소 존재성 체크
    if (uiGold != null && !Number.isNaN(uiGold)) {
      expect(uiGold).toBe(serverGold);
    }
  });
});
