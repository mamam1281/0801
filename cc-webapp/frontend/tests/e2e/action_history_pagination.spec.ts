import { test, expect } from '@playwright/test';

test.describe('Action history pagination', () => {
	test('navigates pages without duplication and shows controls state', async ({ page }) => {
		const base = process.env.BASE_URL || 'http://frontend:3000';
		await page.goto(base);

		// 간단 내비게이션: 하단 탭으로 프로필 진입
		await page.getByText('프로필').first().click();

		// 리스트 로드 대기
		const list = page.locator('[data-testid="action-history-list"]');
		await expect(list).toBeVisible({ timeout: 15000 });

		const firstPageIds = await list.locator('> div').evaluateAll((rows) => rows.map(r => r.getAttribute('key') || r.getAttribute('data-key')));

		// 다음 페이지
		const nextBtn = page.getByTestId('action-next');
		if (await nextBtn.isEnabled()) {
			await nextBtn.click();
			await list.waitFor();
			const secondPageIds = await list.locator('> div').evaluateAll((rows) => rows.map(r => r.getAttribute('key') || r.getAttribute('data-key')));
			if (firstPageIds && secondPageIds) {
				const dup = secondPageIds.filter((id) => id && firstPageIds.includes(id));
				expect(dup.length).toBe(0);
			}
		}

		// 이전 페이지 버튼 상태 확인
		const prevBtn = page.getByTestId('action-prev');
		await expect(prevBtn).toBeVisible();
	});
});
