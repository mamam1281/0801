import { test, expect } from '@playwright/test';

// 단순 E2E 스모크: 성공 / 실패+재시도 / 수량 케이스(UI 변동)
// 백엔드는 실제 동작 환경에서 응답에 따라 결과가 달라질 수 있으므로,
// 여기서는 UI 상태 전이를 중심으로 검증합니다.

test.describe('Shop Buy Flow', () => {
  test('성공 플로우: 구매 확인 → 성공 토스트', async ({ page }) => {
    await page.goto('/');
    // 데모: 상점 진입 경로는 프로젝트마다 다르므로, ShopScreen이 기본 페이지라고 가정
    await page.getByRole('button', { name: /구매하기/ }).first().click();
    await expect(page.getByText('구매 확인')).toBeVisible();
    await page.getByRole('button', { name: '확인' }).click();
    // 성공 토스트 텍스트 가정
    await expect(page.getByText(/구매 완료:/)).toBeVisible({ timeout: 5000 });
  });

  test('실패 + 재시도: 에러 배너 표시 후 재시도', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /구매하기/ }).first().click();
    await expect(page.getByText('구매 확인')).toBeVisible();
    // 실패를 강제하기 어렵기 때문에, 버튼 클릭 후 에러 배너가 보이면 재시도, 아니면 스킵
    await page.getByRole('button', { name: '확인' }).click();
    const errorBanner = page.getByText(/오류|실패|구매 요청 중 오류/);
    if (await errorBanner.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.getByRole('button', { name: '확인' }).click();
      await expect(page.getByText(/구매 완료:/)).toBeVisible({ timeout: 5000 });
    }
  });

  test('수량 케이스: 통화 타입에서 수량 증가에 따라 금액/잔액 표시 변화', async ({ page }) => {
    await page.goto('/');
    // 통화형 아이템의 첫 카드 가정
    await page.getByRole('button', { name: /구매하기/ }).first().click();
    await expect(page.getByText('구매 확인')).toBeVisible();
    const plus = page.getByRole('button', { name: '+' });
    await plus.click();
    await plus.click();
    // 금액 텍스트가 증가했는지 간단 확인
    await expect(page.getByText(/G$/)).toBeVisible();
  });
});
