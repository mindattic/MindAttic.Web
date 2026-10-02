// Playwright configuration for the MindAttic.UiUx package + the three sites that consume it.
//
//   TEST_MODE=local (default)  sites are served from the sibling repos by lib/static-server.mjs, and every
//                              https://cdn.jsdelivr.net/gh/mindattic/MindAttic.UiUx@<tag>/** request is answered
//                              from THIS working tree (so tests pass before a tag is published, and fail loudly
//                              when a referenced file does not exist locally). No other network is allowed.
//   TEST_MODE=live             real sites, real CDN, no interception (external link navigations are still
//                              stubbed so a click never leaves the page under test).
//
//   PW_CHANNEL                 'chrome' (default, uses the installed Google Chrome), 'msedge', or 'chromium'
//                              (Playwright's own browser: run `npx playwright install chromium` first).
import { defineConfig } from '@playwright/test';

const live = process.env.TEST_MODE === 'live';
const ch = process.env.PW_CHANNEL || 'chrome';
const channel = ch === 'chromium' ? undefined : ch;

export default defineConfig({
  testDir: './specs',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    channel,
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: live
    ? undefined
    : {
        command: 'node lib/static-server.mjs',
        url: 'http://127.0.0.1:4173/__health',
        reuseExistingServer: true,
        timeout: 20_000,
      },
  projects: [
    { name: 'assets', testDir: './specs/assets' },
    { name: 'cdn', testDir: './specs/cdn' },
    { name: 'sites', testDir: './specs/sites' },
  ],
});
