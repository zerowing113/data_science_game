import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './packaged-tests', testMatch: '**/restart.check.ts',
  timeout: 300_000, expect: { timeout: 20_000 }, workers: 1,
});
