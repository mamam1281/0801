import { test, expect } from '@playwright/test';

test.describe('Action history pagination', () => {
	test('navigates pages without duplication and shows controls state', async ({ page }) => {
		const base = process.env.BASE_URL || 'http://frontend:3000';

		// 0) 인증 시드: 신규 유저 등록 후 토큰을 번들 형태로 주입
		// Avoid direct process typing issues in TS runner
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const API = (((globalThis as any).process?.env?.API_BASE_URL as string) || 'http://localhost:8000');
		const nickname = 'hist_' + Math.random().toString(36).slice(2, 8);
		const reg = await page.request.post(`${API}/api/auth/register`, {
			data: { nickname, invite_code: ((((globalThis as any).process?.env?.E2E_INVITE_CODE as string) || '5858') as string) }
		});
		expect(reg.ok()).toBeTruthy();
		const { access_token, refresh_token } = await reg.json();
		await page.addInitScript(([a, r]: [string, string | undefined]) => {
			try { localStorage.setItem('cc_auth_tokens', JSON.stringify({ access_token: a, refresh_token: r || undefined })); } catch {}
		}, access_token as string, (refresh_token as string | undefined));

		// 1) 홈 진입(토큰 주입 이후)
		await page.goto(base);
		// 초기화 대기
		await page.waitForTimeout(200);

		// 2) 간단 내비게이션: 하단 탭으로 프로필 진입
		await page.getByText('프로필').first().click();

		// 리스트 로드 대기
		const list = page.locator('[data-testid="action-history-list"]');
		await expect(list).toBeVisible({ timeout: 15000 });

		const firstPageIds = await list.locator('> div').evaluateAll((rows: Element[]) => rows.map((r: Element) => (r.getAttribute('key') || r.getAttribute('data-key')) as string | null));

		// 다음 페이지
		const nextBtn = page.getByTestId('action-next');
		if (await nextBtn.isEnabled()) {
			await nextBtn.click();
			await list.waitFor();
			const secondPageIds = await list.locator('> div').evaluateAll((rows: Element[]) => rows.map((r: Element) => (r.getAttribute('key') || r.getAttribute('data-key')) as string | null));
			if (firstPageIds && secondPageIds) {
				const dup = (secondPageIds as (string | null)[]).filter((id: string | null) => id && (firstPageIds as (string | null)[]).includes(id));
				expect(dup.length).toBe(0);
			}
		}

		// 이전 페이지 버튼 상태 확인
		const prevBtn = page.getByTestId('action-prev');
		await expect(prevBtn).toBeVisible();
	});
});
