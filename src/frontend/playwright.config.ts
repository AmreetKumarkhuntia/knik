import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './src/tests/browser',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  reporter: 'list',
  outputDir: './test-results',
  use: {
    channel: 'chrome',
    headless: true,
    baseURL: 'http://127.0.0.1:8020',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    reducedMotion: 'reduce',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --strictPort',
    url: 'http://127.0.0.1:8020',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
