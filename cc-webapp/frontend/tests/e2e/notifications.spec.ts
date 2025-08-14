import { test, expect } from '@playwright/test';

test('notifications smoke: push -> toast/list update', async ({ page }) => {
  await page.goto('/notifications');
  await expect(page.getByText('Real-time Notifications')).toBeVisible();
  await page.getByRole('button', { name: 'Send Test Notification' }).click();
  await expect(page.locator('text=Test')).toBeVisible({ timeout: 7000 });
});
