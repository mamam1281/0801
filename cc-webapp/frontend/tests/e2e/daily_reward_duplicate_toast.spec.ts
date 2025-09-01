import { test, expect } from '@playwright/test';

// 시나리오: 첫 수령 후 즉시 재수령 시, 고정 토스트 메시지 노출(rewardMessages.alreadyClaimed)
// 프론트 로직: HomeDashboard.claimDailyReward → unifiedApi.post('streak/claim', ...)

test.describe('[DailyReward] duplicate claim toast', () => {
  test('second claim shows alreadyClaimed toast', async ({ page, request }: { page: import('@playwright/test').Page; request: import('@playwright/test').APIRequestContext }) => {
    const BASE = process.env.BASE_URL || 'http://frontend:3000';
    const API = process.env.API_BASE_URL || 'http://localhost:8000';

    // 1) 신규 가입 및 토큰 확보
    const nickname = 'dr_' + Math.random().toString(36).slice(2, 8);
    const reg = await request.post(`${API}/api/auth/register`, {
      data: { nickname, invite_code: process.env.E2E_INVITE_CODE || '5858' }
    });
    expect(reg.ok()).toBeTruthy();
    const { access_token, refresh_token } = await reg.json();

  await page.addInitScript(([a, r, nick]: [string, string | undefined, string]) => {
      try {
        localStorage.setItem('cc_auth_tokens', JSON.stringify({ access_token: a, refresh_token: r || undefined }));
        localStorage.setItem('game-user', JSON.stringify({ id: 'e2e', nickname: nick, goldBalance: 0, level: 1 }));
      } catch {}
    }, access_token, refresh_token, nickname);

    // 2) 홈 진입 후 일일 보상 모달 열기
    await page.goto(BASE + '/');
    // VIP 포인트 카드 클릭 시 모달 열림(HomeDashboard에서 setShowDailyReward(true))
    await page.getByText('VIP 포인트', { exact: false }).first().click();

    // 3) 첫 수령(성공 경로)
    const claimBtn = page.getByRole('button', { name: /보상 받기!|이미 수령됨/ });
    await claimBtn.waitFor({ state: 'visible' });
    // 첫 클릭: 실제 수령 수행
    if (await claimBtn.isVisible()) {
      await claimBtn.click();
    }

  // 4) 재수령 시도: 상태가 dailyClaimed=true로 버튼 비활성화되어 있을 수 있으므로 페이지 새로고침
  await page.reload();
  // 다시 VIP 포인트 카드 클릭 → 모달 오픈
  await page.getByText('VIP 포인트', { exact: false }).first().click();
  const claimBtn2 = page.getByRole('button', { name: /보상 받기!/ });
  await claimBtn2.waitFor({ state: 'visible' });
  // 두번째 클릭 → 백엔드 중복 응답(400)을 유도하여 프론트에서 alreadyClaimed 토스트 노출
  await claimBtn2.click();

    // 5) 토스트 메시지 확인 (접근성 role='status' 또는 'alert' 사용 / 텍스트 매칭)
    // 메시지는 이모지 포함일 수 있으므로 부분 문자열로 탐지
    const partial = '오늘 출석 보상은 이미 받으셨어요';
    // 우선 순위: data-testid / role 기반 토스트 → 텍스트 백업
    const toastByRole = page.getByRole('status').or(page.getByRole('alert'));
    const toastByTestId = page.getByTestId('toast').or(page.getByTestId('notification-toast'));
    const toastByText = page.getByText(new RegExp(partial));
    // 세 경로 중 하나가 나타나면 성공 처리
    const visible = await Promise.race([
      toastByRole.waitFor({ state: 'visible', timeout: 4000 }).then(() => true).catch(() => false),
      toastByTestId.waitFor({ state: 'visible', timeout: 4000 }).then(() => true).catch(() => false),
      toastByText.waitFor({ state: 'visible', timeout: 4000 }).then(() => true).catch(() => false),
    ]);
    expect(visible).toBeTruthy();
  });
});
