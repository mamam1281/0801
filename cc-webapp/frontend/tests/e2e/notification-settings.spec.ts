import { test, expect } from '@playwright/test';

test.describe('알림 설정 페이지', () => {
    test('토글 상태가 유지되고 푸시 권한 버튼이 동작한다', async ({ page }) => {
        await page.goto('/notifications/settings');

        const unread = page.locator('#unreadOnly');
        const sse = page.locator('#sseToggle');

        await expect(unread).toBeVisible();
        await expect(sse).toBeVisible();

        const initialUnread = await unread.isChecked();
        await unread.click();
        await expect(unread).toBeChecked({ checked: !initialUnread });
        await page.reload();
        await expect(page.locator('#unreadOnly')).toBeChecked({ checked: !initialUnread });

        const infoBtn = page.getByRole('button', { name: 'info' });
        await infoBtn.click();
        await page.reload();
        // class 토글로 상태 확인 (음소거 시 opacity-60 포함)
        await expect(page.getByRole('button', { name: 'info' })).toHaveClass(/opacity-60/);

        const initialSSE = await sse.isChecked();
        await sse.click();
        await page.reload();
        await expect(page.locator('#sseToggle')).toBeChecked({ checked: !initialSSE });

        // 브라우저 푸시 권한 요청 버튼 검증 - requestPermission을 스텁
        await page.evaluate(() => {
            // @ts-ignore
            window.Notification = { requestPermission: () => Promise.resolve('granted') } as any;
        });

        const [log] = await Promise.all([
            page.waitForEvent('console', { timeout: 2000 }),
            page.getByRole('button', { name: '브라우저 푸시 권한 요청' }).click(),
        ]);
        expect(log.text()).toContain('Push permission');
    });
});
