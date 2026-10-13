import { expect, test } from '@playwright/test'

test('MSW worker controls the page and answers API requests', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'GreenMint' })).toBeVisible()

  const controller = await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)
  expect(controller).toContain('/mockServiceWorker.js')

  const health = await page.evaluate(async () => {
    const res = await fetch('/api/health')
    return { status: res.status, body: await res.json() }
  })
  expect(health).toEqual({ status: 200, body: { status: 'ok' } })

  const unknown = await page.evaluate(async () => {
    const res = await fetch('/api/does-not-exist')
    return { status: res.status, body: await res.json() }
  })
  expect(unknown.status).toBe(404)
  expect(unknown.body).toMatchObject({ code: 'NOT_FOUND' })
})
