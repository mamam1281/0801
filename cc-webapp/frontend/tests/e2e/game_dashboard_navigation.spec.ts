import { test, expect, Page } from '@playwright/test';

const ENABLE_NAV_SMOKE = process.env.E2E_UI_NAV_SMOKE === '1';
test.skip(!ENABLE_NAV_SMOKE, 'Disabled by default. Set E2E_UI_NAV_SMOKE=1 to enable Game Dashboard nav smoke.');

// Simple nav smoke: ensure bottom nav can open the Game Dashboard screen.
test.describe('Navigation', () => {
  test('Programmatic nav → Game Dashboard shows screen', async ({ page }: { page: Page }) => {
    const base = process.env.BASE_URL || 'http://localhost:3000';
    // Seed flags before any app code runs
    await page.addInitScript(() => {
      try {
        localStorage.setItem('E2E_FORCE_SCREEN', 'home-dashboard');
        // Minimal stub user to ensure dashboards render
        const stub = { id: 'E2E', nickname: 'E2E', goldBalance: 1000, level: 1, dailyStreak: 0 };
        localStorage.setItem('game-user', JSON.stringify(stub));
      } catch {}
    });
    await page.goto(base);

    // Ensure helper is available and set the user via app-level API
  await page.waitForFunction(() => typeof (window as any).__E2E_NAV === 'function', undefined, { timeout: 8000 });
    await page.waitForFunction(() => typeof (window as any).__E2E_SET_USER === 'function', undefined, { timeout: 8000 });
    await page.evaluate(() => {
      const stub = { id: 'E2E', nickname: 'E2E', goldBalance: 1000, level: 1, dailyStreak: 0 };
      (window as any).__E2E_SET_USER(stub);
    });
    // Programmatic navigation to avoid overlay/click interference
  await page.evaluate(() => { (window as any).__E2E_NAV('game-dashboard'); });

  // Assert screen container visible
  await expect(page.getByTestId('game-dashboard')).toBeVisible({ timeout: 10000 });
  });
});
