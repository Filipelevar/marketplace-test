import { defineConfig, devices } from '@playwright/test'

const PORT = 5173
// PW_BASE_URL runs the suite against an already running target (vite preview, deployed demo)
const EXTERNAL_BASE_URL = process.env.PW_BASE_URL
const BASE_URL = EXTERNAL_BASE_URL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: EXTERNAL_BASE_URL
    ? undefined
    : {
        command: `yarn dev --port ${PORT} --strictPort`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
      },
})
