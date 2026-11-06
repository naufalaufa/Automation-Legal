import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';

const envFile = resolve(process.cwd(), '.env');
if (existsSync(envFile)) loadEnvFile(envFile);

const stagingBaseURL = 'https://sitedev-legal.pgindonesia.com';
const baseURL = process.env.LEGAL_BASE_URL ?? stagingBaseURL;

if (new URL(baseURL).hostname !== new URL(stagingBaseURL).hostname) {
  throw new Error(
    `Refusing to run against ${baseURL}. LEGAL_BASE_URL must point to the Legal staging host.`,
  );
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['list'], ['html', { open: 'never' }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Chrome is already available on this workstation. CI uses the
        // Playwright-managed Chromium installed by the pipeline.
        channel: process.env.CI
          ? undefined
          : process.env.PLAYWRIGHT_CHANNEL || 'chrome',
      },
    },
  ],
});
