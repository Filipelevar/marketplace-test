import { expect, test, type Page } from '@playwright/test'
import { switchScenario, useScenario } from '../support/mock-scenario.ts'

const cards = (page: Page) => page.locator('#catalogo article')
const cardNames = (page: Page) => cards(page).locator('a > span')

async function openFilters(page: Page) {
  if (await page.getByRole('complementary', { name: 'Filtros do catálogo' }).isVisible()) {
    return page.getByRole('complementary', { name: 'Filtros do catálogo' })
  }
  await page.getByRole('button', { name: /^Filtros/ }).click()
  return page.getByRole('dialog')
}

async function closeFilters(page: Page) {
  if (await page.getByRole('dialog').isVisible()) await page.keyboard.press('Escape')
}

test.describe('catálogo', () => {
  test('busca, filtros combinados, ordenação e paginação compõem a URL e sobrevivem a histórico e refresh', async ({
    page,
  }) => {
    await useScenario(page)
    await page.goto('/')
    await expect(cards(page)).toHaveCount(9)
    await expect(cardNames(page).first()).toHaveText('Emerald Ape #042')

    await page.getByRole('link', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(cardNames(page).first()).toHaveText('Jade Monarch #233')

    let filters = await openFilters(page)
    await filters.getByRole('button', { name: /Arte digital/ }).click()
    await expect(page).not.toHaveURL(/page=/)
    await expect(page).toHaveURL(/collections=arte-digital/)
    await expect(cards(page)).toHaveCount(4)

    await filters.getByRole('button', { name: /Ethereum/ }).click()
    await expect(page).toHaveURL(/networks=ethereum/)
    await expect(cards(page)).toHaveCount(2)
    await expect(filters.getByRole('button', { name: /Arte digital/ })).toHaveAttribute('aria-pressed', 'true')
    await closeFilters(page)

    await page.getByRole('combobox', { name: 'Ordenar por:' }).click()
    await page.getByRole('option', { name: 'Maior preço' }).click()
    await expect(page).toHaveURL(/sort=preco-desc/)
    await expect(cardNames(page)).toHaveText(['Slate Marquis #448', 'Emerald Ape #042'])

    await page.goBack()
    await expect(page).not.toHaveURL(/sort=/)
    await expect(cardNames(page)).toHaveText(['Emerald Ape #042', 'Slate Marquis #448'])

    await page.goBack()
    await expect(page).not.toHaveURL(/networks=/)
    await expect(cards(page)).toHaveCount(4)

    await page.goForward()
    await page.reload()
    await expect(page).toHaveURL(/collections=arte-digital/)
    await expect(page).toHaveURL(/networks=ethereum/)
    await expect(cards(page)).toHaveCount(2)
    filters = await openFilters(page)
    await expect(filters.getByRole('button', { name: /Ethereum/ })).toHaveAttribute('aria-pressed', 'true')
  })

  test('busca por nome, resultado vazio e limpeza dos filtros', async ({ page }) => {
    await useScenario(page)
    await page.goto('/?q=emerald')
    await expect(cardNames(page)).toHaveText(['Emerald Ape #042', 'Emerald Echo #305'])

    await page.goto('/?q=inexistente')
    await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
    await page.locator('#catalogo').getByRole('button', { name: 'Limpar filtros' }).last().click()
    await expect(page).not.toHaveURL(/q=/)
    await expect(cards(page)).toHaveCount(9)
  })

  test('parâmetros inválidos na URL são descartados sem quebrar a página', async ({ page }) => {
    await useScenario(page)
    await page.goto('/?page=abc&collections=nao-existe&sort=qualquer')
    await expect(cards(page)).toHaveCount(9)
    await expect(cardNames(page).first()).toHaveText('Emerald Ape #042')
  })

  test('catálogo vazio mostra estado vazio', async ({ page }) => {
    await useScenario(page, 'vazio')
    await page.goto('/')
    await expect(page.getByText('Ainda não há NFTs listados no mercado.')).toBeVisible()
  })

  test('mostra skeletons durante carregamento lento', async ({ page }) => {
    await useScenario(page, 'lento')
    await page.goto('/')
    await expect(page.locator('#catalogo [data-slot="skeleton"]').filter({ visible: true }).first()).toBeVisible()
    await expect(cards(page)).toHaveCount(9, { timeout: 15_000 })
    await expect(page.locator('#catalogo ul [data-slot="skeleton"]')).toHaveCount(0)
  })

  test('falha de conexão exibe erro e recupera ao tentar novamente', async ({ page }) => {
    await useScenario(page, 'offline')
    await page.goto('/')
    const alert = page.getByRole('alert').filter({ hasText: 'Não foi possível carregar o catálogo' })
    await expect(alert).toBeVisible({ timeout: 15_000 })

    await switchScenario(page, 'padrao')
    await alert.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(cards(page)).toHaveCount(9)
  })

  test('respostas fora de ordem não sobrescrevem a seleção mais recente', async ({ page }) => {
    await useScenario(page, 'fora-de-ordem')
    await page.goto('/')
    await expect(cards(page)).toHaveCount(9, { timeout: 15_000 })

    await page.getByRole('button', { name: 'Novos lançamentos' }).click()
    await page.getByRole('button', { name: 'Em alta' }).click()

    await expect(page).toHaveURL(/tab=em-alta/)
    await expect(page.getByRole('button', { name: 'Em alta' })).toHaveAttribute('aria-pressed', 'true')
    await expect(cardNames(page).first()).toHaveText('Sage Nomad #009', { timeout: 15_000 })
    await page.waitForTimeout(2_000)
    await expect(cardNames(page).first()).toHaveText('Sage Nomad #009')
  })
})
