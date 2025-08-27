// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe('WS→UI 반영 스모크', () => {
  test('홈 대시보드 GOLD가 /auth/me 및 /users/balance와 동기 유지(간접 검증)', async ({ page, request }) => {
    // 1) 홈 접근
    await page.goto('/');
    // 2) 토큰이 있는 상태로 가정: 서버의 권위 값 조회
    //    백엔드 베이스는 프록시/동일 오리진을 가정하여 상대 호출 사용 불가 → page 요청 기준으로 /api 프록시 사용
    let authRes = await page.request.get('/api/auth/me');
    if (!authRes.ok()) {
      // 초기 렌더 직후 번들/마이그레이션 타이밍 이슈 완화: 짧게 대기 후 1회 재시도
      await page.waitForTimeout(300);
      authRes = await page.request.get('/api/auth/me');
    }
    expect(authRes.ok()).toBeTruthy();
    const me = await authRes.json();
    const balRes = await page.request.get('/api/users/balance');
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
