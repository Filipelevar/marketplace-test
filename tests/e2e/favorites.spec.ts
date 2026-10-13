import { expect, test } from '@playwright/test'
import { failNext, signIn, USERS } from '../support/auth.ts'
import { useScenario } from '../support/mock-scenario.ts'

test.describe('favoritos', () => {
  test.beforeEach(async ({ page }) => {
    await useScenario(page)
  })

  test('visitante é levado ao login ao tentar favoritar', async ({ page }) => {
    await page.goto('/nfts/sage-nomad-009')
    await page.getByRole('button', { name: 'Favoritar Sage Nomad #009' }).filter({ visible: true }).first().click()
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fnfts%2Fsage-nomad-009/)
  })

  test('atualização otimista com rollback em falha e persistência após sucesso', async ({ page }) => {
    await signIn(page, USERS.ana, '/nfts/sage-nomad-009')
    const favorite = page.getByRole('button', { name: /^(Favoritar Sage Nomad #009|Remover Sage Nomad #009 dos favoritos)$/ }).filter({ visible: true }).first()
    await expect(favorite).toHaveAttribute('aria-pressed', 'false')

    await failNext(page, 'PUT', '/api/favorites', { delayMs: 800 })
    await favorite.click()
    await expect(favorite).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText('Não foi possível favoritar.')).toBeVisible()
    await expect(favorite).toHaveAttribute('aria-pressed', 'false')

    await favorite.click()
    await expect(page.getByText('Sage Nomad #009 adicionado à lista de interesse.')).toBeVisible()
    await expect(favorite).toHaveAttribute('aria-pressed', 'true')

    await page.reload()
    await expect(page.getByRole('button', { name: 'Remover Sage Nomad #009 dos favoritos' }).filter({ visible: true }).first()).toBeVisible()

    await page.goto('/favoritos')
    await expect(page.locator('main article')).toHaveCount(3)
    await expect(page.locator('main').getByText('Sage Nomad #009')).toBeVisible()
  })
})
