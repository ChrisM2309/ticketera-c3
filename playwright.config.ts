import { defineConfig, devices } from '@playwright/test';

const port = process.env.PLAYWRIGHT_PORT ?? '3000';
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER === 'true' || !process.env.CI;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
