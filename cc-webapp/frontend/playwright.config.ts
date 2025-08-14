import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 30_000,
    use: {
        baseURL: 'http://localhost:3000',
        headless: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    webServer: {
        command: 'npm run dev',
        port: 3000,
        reuseExistingServer: true,
        timeout: 120_000,
        env: {
            NEXT_TELEMETRY_DISABLED: '1',
            NODE_ENV: 'test',
            NEXT_PUBLIC_API_BASE_URL: 'http://localhost:8001',
        },
    },
    projects: [
        { name: 'chromium', use: { browserName: 'chromium' } },
    ],
    reporter: [['list'], ['html', { outputFolder: 'test-results/playwright-report' }]],
});
