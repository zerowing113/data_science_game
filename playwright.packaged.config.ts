import { defineConfig } from '@playwright/test';
import config from './playwright.config';
export default defineConfig({
  ...config,
  use: { ...config.use, baseURL: 'http://127.0.0.1:43190',
    // No external network path, including worker runtime requests. Loopback
    // remains reachable: browser offline mode would block the local game too.
    proxy: { server: 'http://127.0.0.1:9', bypass: '127.0.0.1' },
  },
  webServer: { command: 'node scripts/run-packaged.mjs', url: 'http://127.0.0.1:43190/__launcher/status', reuseExistingServer: false },
});
