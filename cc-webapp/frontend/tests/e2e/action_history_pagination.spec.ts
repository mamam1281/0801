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
		await page.addInitScript(([a, r, nick]: [string, string | undefined, string]) => {
			try {
				localStorage.setItem('cc_auth_tokens', JSON.stringify({ access_token: a, refresh_token: r || undefined }));
				// App 초기화에서 restoreSavedUser()로 user truthy 필요 → 최소 game-user 시드
				localStorage.setItem('game-user', JSON.stringify({ id: 'e2e', nickname: nick, goldBalance: 0, level: 1 }));
				// E2E: 초기화 시 바로 프로필로 진입하도록 플래그 설정
				localStorage.setItem('E2E_FORCE_SCREEN', 'profile');
				// E2E: 액션 이력은 테스트 전용 스텁 데이터로 결정적 렌더링
				localStorage.setItem('E2E_ACTION_HISTORY_STUB', '1');
			} catch {}
		}, access_token as string, (refresh_token as string | undefined), nickname as string);

		// 0-1) UI 하단 내비게이션 렌더를 위해 최소 사용자 스텁도 주입
		await page.addInitScript((nick: string) => {
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

		// 1) 진입 후 전역 E2E 헬퍼로 즉시 유저/화면 세팅
		await page.goto(base);
		await page.evaluate(() => {
			(window as any).__E2E_SET_USER?.();
			(window as any).__E2E_NAV?.('profile');
		});

		// 리스트 로드 대기
		const list = page.locator('[data-testid="action-history-list"]');
		await expect(list).toBeVisible({ timeout: 20000 });

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
