const { test, expect } = require('@playwright/test');

test.describe('Action history pagination', () => {
  test('navigates pages without duplication and shows controls state', async ({ page }) => {
    const base = process.env.BASE_URL || 'http://frontend:3000';
    const API = process.env.API_BASE_URL || 'http://localhost:8000';

    // 0) 인증 시드: 신규 유저 등록 후 토큰을 번들 형태로 주입
    const nickname = 'histjs_' + Math.random().toString(36).slice(2, 8);
    const reg = await page.request.post(`${API}/api/auth/register`, {
      data: { nickname, invite_code: process.env.E2E_INVITE_CODE || '5858' }
    });
    expect(reg.ok()).toBeTruthy();
    const { access_token, refresh_token } = await reg.json();
  await page.addInitScript(([a, r, nick]) => {
      try {
        localStorage.setItem('cc_auth_tokens', JSON.stringify({ access_token: a, refresh_token: r || undefined }));
        localStorage.setItem('game-user', JSON.stringify({ id: 'e2e', nickname: nick, goldBalance: 0, level: 1 }));
    // E2E: 초기화 시 바로 프로필로 진입하도록 플래그 설정
  localStorage.setItem('E2E_ACTION_HISTORY_STUB', '1');
    localStorage.setItem('E2E_FORCE_SCREEN', 'profile');
      } catch {}
    }, access_token, refresh_token, nickname);

      // UI 하단 내비게이션 렌더를 위해 최소 사용자 스텁도 주입
      await page.addInitScript((nick) => {
        try {
          const stub = {
            id: 'e2e-' + Math.random().toString(36).slice(2),
            nickname: nick,
            goldBalance: 1000,
            level: 1,
            dailyStreak: 0,
            lastLogin: new Date().toISOString(),
          };
          localStorage.setItem('game-user', JSON.stringify(stub));
        } catch {}
      }, nickname);

  await page.goto(base);
  await page.evaluate(() => {
    window.__E2E_SET_USER?.();
    window.__E2E_NAV?.('profile');
  });

    // 리스트 로드 대기
  const list = page.locator('[data-testid="action-history-list"]');
  await expect(list).toBeVisible({ timeout: 20000 });

    const firstPageTexts = await list.locator('> div').allTextContents();

    // 다음 페이지
    const nextBtn = page.getByTestId('action-next');
    if (await nextBtn.isEnabled()) {
      await nextBtn.click();
      await list.waitFor();
      const secondPageTexts = await list.locator('> div').allTextContents();
      // 간단 중복 체크: 전체 텍스트 기준 교집합이 크지 않아야 함
      const dup = secondPageTexts.filter((t) => firstPageTexts.includes(t));
      expect(dup.length).toBeLessThan(Math.max(1, Math.floor(firstPageTexts.length * 0.2)));
    }

    // 이전 페이지 버튼 상태 확인
    const prevBtn = page.getByTestId('action-prev');
    await expect(prevBtn).toBeVisible();
  });
});
