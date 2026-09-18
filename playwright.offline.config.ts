import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './packaged-tests', timeout: 120_000, expect: { timeout: 20_000 }, workers: 1,
  use: { baseURL: 'http://127.0.0.1:43190', viewport: { width: 1440, height: 1000 }, trace: 'retain-on-failure' },
  webServer: { command: 'node scripts/run-packaged.mjs', url: 'http://127.0.0.1:43190/__launcher/status', reuseExistingServer: false },
});
