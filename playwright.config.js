const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  reporter: [
    ['list'],
    ['html', {
      outputFolder: 'evidence/entregable-1/playwright-report',
      open: 'never'
    }]
  ],
  outputDir: 'evidence/entregable-1/playwright-results',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    ...devices['Desktop Chrome'],
    headless: process.env.HEADED !== '1',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure'
  }
});
