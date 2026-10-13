import { expect, type Page } from '@playwright/test'

export const USERS = {
  ana: { email: 'ana@kurio.dev', password: 'Kurio@2026', firstName: 'Ana' },
  bruno: { email: 'bruno@kurio.dev', password: 'Kurio@2026', firstName: 'Bruno' },
} as const

export async function fillLogin(page: Page, user: { email: string; password: string }) {
  await page.getByLabel('E-mail', { exact: true }).fill(user.email)
  await page.getByLabel('Senha', { exact: true }).fill(user.password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
}

export async function signIn(page: Page, user: (typeof USERS)[keyof typeof USERS], redirect = '/') {
  await page.goto(`/entrar?redirect=${encodeURIComponent(redirect)}`)
  await fillLogin(page, user)
  await expect(page).not.toHaveURL(/\/entrar/)
}

export async function signOut(page: Page) {
  await page.goto('/perfil')
  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL(/\/$/)
}

export async function expireSessions(page: Page) {
  await page.evaluate(() => fetch('/api/__dev/session/expire', { method: 'POST' }))
}

export async function failNext(
  page: Page,
  method: string,
  path: string,
  options: { status?: number | 'network'; delayMs?: number } = {},
) {
  await page.evaluate(
    (body) =>
      fetch('/api/__dev/fail-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    { method, path, status: options.status ?? 503, delayMs: options.delayMs },
  )
}
