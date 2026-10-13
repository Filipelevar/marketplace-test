import { expect, test, type Page } from '@playwright/test'
import { fillLogin, signOut, USERS } from '../support/auth.ts'
import { useScenario } from '../support/mock-scenario.ts'

const summary = (page: Page) => page.getByRole('region', { name: 'Resumo da carteira' })

async function expectTotal(page: Page, label: string, value: string) {
  const row = summary(page).locator('div').filter({ has: page.getByText(label, { exact: true }) }).last()
  await expect(row.locator('dd')).toHaveText(value)
}

async function addFromDetail(page: Page, path: string) {
  await page.goto(path)
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).filter({ visible: true }).first().click()
  await expect(page).toHaveURL(/\/carrinho$/)
}

test.describe('carrinho', () => {
  test.beforeEach(async ({ page }) => {
    await useScenario(page)
  })

  test('quantidades, cupons, totais e persistência após refresh', async ({ page }) => {
    await addFromDetail(page, '/nfts/sage-nomad-009')
    const item = page.getByRole('group', { name: 'Quantidade de Sage Nomad #009' }).filter({ visible: true })
    await expect(item.locator('output')).toHaveText('1')

    await item.getByRole('button', { name: 'Aumentar quantidade' }).click()
    await expect(item.locator('output')).toHaveText('2')
    await expectTotal(page, 'Subtotal', '3.38 ETH')
    await expectTotal(page, 'Taxa de rede', '0.016 ETH')
    await expectTotal(page, 'Total', '3.396 ETH')

    const coupon = summary(page).getByLabel('Código promocional')
    await coupon.fill('NAOEXISTE')
    await summary(page).getByRole('button', { name: 'Aplicar' }).click()
    await expect(summary(page).getByRole('alert')).toHaveText('Cupom inválido.')
    await expect(coupon).toHaveAttribute('aria-invalid', 'true')

    await coupon.fill('GENESIS2025')
    await summary(page).getByRole('button', { name: 'Aplicar' }).click()
    await expect(summary(page).getByRole('alert')).toHaveText('Este cupom expirou.')

    await coupon.fill('kurio10')
    await summary(page).getByRole('button', { name: 'Aplicar' }).click()
    await expect(summary(page).getByText('KURIO10')).toBeVisible()
    await expectTotal(page, 'Desconto do lançamento', '(-) 0.338 ETH')
    await expectTotal(page, 'Total', '3.058 ETH')

    await page.reload()
    await expect(page.getByRole('group', { name: 'Quantidade de Sage Nomad #009' }).filter({ visible: true }).locator('output')).toHaveText('2')
    await expectTotal(page, 'Total', '3.058 ETH')

    await summary(page).getByRole('button', { name: 'Remover cupom KURIO10' }).click()
    await expectTotal(page, 'Total', '3.396 ETH')

    await page.getByRole('button', { name: 'Remover Sage Nomad #009 do carrinho' }).filter({ visible: true }).click()
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  })

  test('carrinho do visitante é preservado ao entrar e isolado entre usuários', async ({ page }) => {
    await addFromDetail(page, '/nfts/ivory-baron-088')
    await expect(page.getByRole('group', { name: 'Quantidade de Ivory Baron #088' }).filter({ visible: true })).toBeVisible()

    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fpagamento/)
    await fillLogin(page, USERS.ana)
    await expect(page).toHaveURL(/\/pagamento$/)

    await page.goto('/carrinho')
    await expect(page.getByRole('group', { name: 'Quantidade de Ivory Baron #088' }).filter({ visible: true })).toBeVisible()

    await signOut(page)
    await page.goto('/carrinho')
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()

    await page.goto('/entrar?redirect=%2Fcarrinho')
    await fillLogin(page, USERS.bruno)
    await expect(page).toHaveURL(/\/carrinho$/)
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  })

  test('limite de disponibilidade da edição bloqueia quantidade excedente', async ({ page }) => {
    await page.goto('/nfts/sage-nomad-009?edition=1-10')
    const stepper = page.getByRole('group', { name: 'Quantidade' }).filter({ visible: true })
    await stepper.getByRole('button', { name: 'Aumentar quantidade' }).click()
    await stepper.getByRole('button', { name: 'Aumentar quantidade' }).click()
    await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).filter({ visible: true }).first().click()
    await expect(page).toHaveURL(/\/carrinho$/)

    const item = page.getByRole('group', { name: 'Quantidade de Sage Nomad #009' }).filter({ visible: true })
    await expect(item.locator('output')).toHaveText('3')
    await expect(item.getByRole('button', { name: 'Aumentar quantidade' })).toBeDisabled()
  })
})
