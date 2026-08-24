import { defineConfig, devices } from '@playwright/test';

const isCi = Boolean(process.env['CI']);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  ...(isCi ? { workers: 2 } : {}),
  reporter: isCi ? 'line' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'pnpm --filter @zenblog/web dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !isCi,
    timeout: 120000
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-webkit', use: { ...devices['iPhone 15 Pro'] } }
  ]
});
