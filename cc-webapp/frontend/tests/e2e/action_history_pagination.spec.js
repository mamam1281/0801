const { test, expect } = require('@playwright/test');

test.describe('Action history pagination', () => {
  test('navigates pages without duplication and shows controls state', async ({ page }) => {
    const base = process.env.BASE_URL || 'http://frontend:3000';
    await page.goto(base);

    // 하단 탭으로 프로필 진입
    await page.getByText('프로필').first().click();

    // 리스트 로드 대기
    const list = page.locator('[data-testid="action-history-list"]');
    await expect(list).toBeVisible({ timeout: 15000 });

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
