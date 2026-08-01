import { defineConfig, devices } from '@playwright/test'

const basePath = '/found-in-translation/'
const baseURL = `http://127.0.0.1:4173${basePath}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `VITE_BASE_PATH=${basePath} npm run dev -- --host 127.0.0.1 --port 4173`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'small-mobile',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'tablet',
      use: {
        browserName: 'chromium',
        viewport: { width: 820, height: 1180 },
        hasTouch: true,
      },
    },
  ],
})
