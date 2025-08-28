import { test, expect } from '@playwright/test';

test.describe('Admin Points UI smoke', () => {
  test('page renders and form validates inputs', async ({ page }) => {
    // 단순 렌더 확인(권한 요구 UI 라우팅은 우회, 페이지 접근만 체크)
    await page.goto('/admin/points');
    await page.waitForLoadState('domcontentloaded');

    // 필드 존재 확인
    const userInput = page.locator('#user_id');
    const amountInput = page.locator('#amount');
    const memoInput = page.locator('#memo');
    const submit = page.getByRole('button', { name: /포인트 지급|지급 중/i });

    await expect(userInput).toHaveCount(1);
    await expect(amountInput).toHaveCount(1);
    await expect(memoInput).toHaveCount(1);

    // 기본적으로 비활성(입력 전)
    await expect(submit).toBeDisabled();

    // 유효하지 않은 값 → 여전히 비활성
    await userInput.fill('abc');
    await amountInput.fill('-10');
    await expect(submit).toBeDisabled();

    // 유효 값 입력 → 활성화 기대
    await userInput.fill('123');
    await amountInput.fill('50');
    await expect(submit).toBeEnabled();
  });
});
