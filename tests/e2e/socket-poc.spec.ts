import { expect, test, type Page } from '@playwright/test'

async function emit(page: Page, body: { event: string; payload: unknown; userId?: string }) {
  return page.evaluate(async (data) => {
    const res = await fetch('/api/__dev/socket/emit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return (await res.json()) as { delivered: number }
  }, body)
}

test('server event reaches socket.io-client through the MSW binding', async ({ page }) => {
  await page.goto('/poc/socket?token=user-a')
  await expect(page.getByTestId('status')).toHaveText('connected')

  const result = await emit(page, { event: 'poc.ping', payload: { n: 1 } })

  expect(result.delivered).toBe(1)
  await expect(page.getByTestId('events')).toContainText('{"n":1}')
})

test('events addressed to a previous user do not reach the new session', async ({ page }) => {
  await page.goto('/poc/socket?token=user-a')
  await expect(page.getByTestId('status')).toHaveText('connected')

  await page.goto('/poc/socket?token=user-b')
  await expect(page.getByTestId('token')).toHaveText('user-b')
  await expect(page.getByTestId('status')).toHaveText('connected')

  expect((await emit(page, { event: 'poc.ping', payload: { to: 'a' }, userId: 'user-a' })).delivered).toBe(0)
  expect((await emit(page, { event: 'poc.ping', payload: { to: 'b' }, userId: 'user-b' })).delivered).toBe(1)

  await expect(page.getByTestId('events')).toContainText('{"to":"b"}')
  await expect(page.getByTestId('events')).not.toContainText('{"to":"a"}')
})

test('client reconnects after the server drops the connection', async ({ page }) => {
  await page.goto('/poc/socket?token=user-a')
  await expect(page.getByTestId('connect-count')).toHaveText('1')

  await page.evaluate(() => fetch('/api/__dev/socket/drop', { method: 'POST' }))

  await expect(page.getByTestId('connect-count')).toHaveText('2', { timeout: 10_000 })
  await expect(page.getByTestId('status')).toHaveText('connected')
})

test('heartbeat keeps the connection alive past the ping timeout', async ({ page }) => {
  await page.clock.install()
  await page.goto('/poc/socket?token=user-a')
  await expect(page.getByTestId('connect-count')).toHaveText('1')

  // pingInterval (25s) + pingTimeout (5s) = 30s without a ping would drop the client
  await page.clock.runFor(120_000)

  await expect(page.getByTestId('status')).toHaveText('connected')
  await expect(page.getByTestId('connect-count')).toHaveText('1')
})
