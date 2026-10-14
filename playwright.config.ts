import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const EXTERNAL_BASE_URL = process.env.PW_BASE_URL
const BASE_URL = EXTERNAL_BASE_URL ?? `http://localhost:${PORT}`

const visualOptions = {
  locale: 'pt-BR',
  timezoneId: 'America/Sao_Paulo',
  colorScheme: 'dark',
} as const

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [['list'], ['html', { open: 'never' }]],
  expect: {
    timeout: 10_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.001, animations: 'disabled', caret: 'hide' },
  },
  snapshotPathTemplate: '{testDir}/{testFileDir}/__screenshots__/{projectName}/{arg}{ext}',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', testDir: './tests/e2e', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', testDir: './tests/e2e', use: { ...devices['Pixel 7'] } },
    {
      name: 'visual-desktop',
      testDir: './tests/visual',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, ...visualOptions },
    },
    { name: 'visual-mobile', testDir: './tests/visual', use: { ...devices['Pixel 7'], ...visualOptions } },
  ],
  webServer: EXTERNAL_BASE_URL
    ? undefined
    : {
        command: `yarn vite build && yarn vite preview --port ${PORT} --strictPort`,
        url: BASE_URL,
        reuseExistingServer: false,
        timeout: 120_000,
      },
})
