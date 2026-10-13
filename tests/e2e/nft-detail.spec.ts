import { expect, test } from '@playwright/test'
import { useScenario } from '../support/mock-scenario.ts'

test.describe('detalhe do NFT', () => {
  test.beforeEach(async ({ page }) => {
    await useScenario(page)
  })

  test('navega do catálogo para o detalhe e suporta acesso direto com refresh', async ({ page }) => {
    await page.goto('/')
    await page.locator('#catalogo').getByRole('link', { name: /Sage Nomad #009/ }).click()

    await expect(page).toHaveURL(/\/nfts\/sage-nomad-009$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Sage Nomad #009' })).toBeVisible()
    await expect(page).toHaveTitle('Sage Nomad #009 | Kurio')

    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: 'Sage Nomad #009' })).toBeVisible()
    await expect(page.getByText('1.69 ETH').first()).toBeVisible()
  })

  test('NFT inexistente mostra estado de não encontrado', async ({ page }) => {
    await page.goto('/nfts/nao-existe')
    await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
    await page.getByRole('link', { name: 'Explorar o mercado' }).click()
    await expect(page).toHaveURL(/\/#catalogo$/)
  })

  test('edição selecionada vai para a URL, sobrevive ao refresh e limita a quantidade', async ({ page }) => {
    await page.goto('/nfts/sage-nomad-009')
    const editions = page.getByRole('group', { name: 'Edição:' })
    await expect(editions.getByRole('radio', { name: '1/50' })).toBeChecked()

    await editions.getByText('1/10').click()
    await expect(page).toHaveURL(/edition=1-10/)
    await expect(page.getByText('Restam apenas 3 unidades desta edição.').first()).toBeVisible()

    await page.reload()
    await expect(page.getByRole('group', { name: 'Edição:' }).getByRole('radio', { name: '1/10' })).toBeChecked()

    const stepper = page.getByRole('group', { name: 'Quantidade' }).filter({ visible: true })
    const increase = stepper.getByRole('button', { name: 'Aumentar quantidade' })
    await increase.click()
    await increase.click()
    await expect(stepper.locator('output')).toHaveText('3')
    await expect(increase).toBeDisabled()
    await expect(stepper.getByRole('button', { name: 'Diminuir quantidade' })).toBeEnabled()
  })

  test('edição esgotada e NFT esgotado bloqueiam a quantidade', async ({ page }) => {
    await page.goto('/nfts/emerald-ape-042?edition=1-1')
    await expect(page.getByText('A edição 1/1 está esgotada. Escolha outra edição.').first()).toBeVisible()

    await page.goto('/nfts/obsidian-lord-099')
    await expect(page.getByText('Este NFT está esgotado em todas as edições.').first()).toBeVisible()
    const stepper = page.getByRole('group', { name: 'Quantidade' }).filter({ visible: true })
    await expect(stepper.getByRole('button', { name: 'Aumentar quantidade' })).toBeDisabled()
  })

  test('mais desta coleção leva a outro NFT e reinicia o estado da página', async ({ page }) => {
    await page.goto('/nfts/emerald-ape-042?edition=aberta')
    const related = page.getByRole('region', { name: 'Mais desta coleção' })
    await related.getByRole('link', { name: /Jade Monarch #233/ }).click()

    await expect(page).toHaveURL(/\/nfts\/jade-monarch-233$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Jade Monarch #233' })).toBeVisible()
    await expect(page.getByRole('group', { name: 'Edição:' }).getByRole('radio', { name: '1/50' })).toBeChecked()
  })

  test('abas de detalhes e avaliações funcionam pelo teclado', async ({ page }) => {
    await page.goto('/nfts/emerald-ape-042')
    const details = page.getByRole('tab', { name: 'Detalhes do NFT' })
    await details.focus()
    await page.keyboard.press('ArrowRight')
    const reviews = page.getByRole('tab', { name: /Avaliações de colecionadores/ })
    await expect(reviews).toBeFocused()
    await expect(reviews).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('tabpanel')).toContainText('lumen.eth')
  })
})
