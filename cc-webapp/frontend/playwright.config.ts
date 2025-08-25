// @ts-ignore NodeJS types for process.env are available via devDependency @types/node
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  // Ensure backend/front are up before tests begin
  globalSetup: './tests/global-setup.js',
  use: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  baseURL: ((globalThis as any).process?.env?.BASE_URL as string) || 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  reporter: [
    ['list'],
    // html 리포터 폴더를 test-results 외부로 분리하여 충돌 방지
    ['html', { outputFolder: 'playwright-report' }]
  ],
});
