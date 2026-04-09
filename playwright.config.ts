import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for mt-store smoke tests.
 *
 * Tests run against the already-live pm2 instance on port 3003 — we
 * don't spin up a webServer here because the production build is
 * sufficient and the DB is live. Each spec does only read-only
 * operations (GET requests) so it's safe to run against prod.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3003',
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: {
      // Some routes (shop pages) rely on the Host header for subdomain
      // routing — override per-test with page.setExtraHTTPHeaders().
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
