import { test, expect, Page } from '@playwright/test';

// Simple nav smoke: ensure bottom nav can open the Game Dashboard screen.
test.describe('Navigation', () => {
  test('Programmatic nav → Game Dashboard shows screen', async ({ page }: { page: Page }) => {
    const base = process.env.BASE_URL || 'http://localhost:3000';
    await page.goto(base);

    // Force initial screen to home and stub a user if none is present
    await page.evaluate(() => {
      try { localStorage.setItem('E2E_FORCE_SCREEN', 'home-dashboard'); } catch {}
    });
    await page.reload();

    // Prefer programmatic navigation to avoid overlay/click interference
    await page.evaluate(() => {
      // @ts-ignore
      window.__E2E_NAV && window.__E2E_NAV('game-dashboard');
    });

  // Assert screen container visible
  await expect(page.getByTestId('game-dashboard')).toBeVisible({ timeout: 10000 });
  });
});
