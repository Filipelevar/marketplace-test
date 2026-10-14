import { expect, test, type Page } from '@playwright/test'
import { signIn, USERS } from '../support/auth.ts'
import { useScenario } from '../support/mock-scenario.ts'
import { waitForSocket } from '../support/realtime.ts'

const NFT_PATH = '/nfts/emerald-ape-042'

async function settle(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(async () => {
    const images = Array.from(document.images)
    for (const image of images) image.loading = 'eager'
    await document.fonts.ready
    await Promise.all(
      images
        .filter((image) => !image.complete)
        .map(
          (image) =>
            new Promise((resolve) => {
              image.addEventListener('load', resolve, { once: true })
              image.addEventListener('error', resolve, { once: true })
            }),
        ),
    )
  })
  await waitForSocket(page)
  await page.waitForLoadState('networkidle')
}

const HIDE_FIXED = '.fixed { visibility: hidden !important; }'

async function snapshot(page: Page, name: string) {
  await expect(page).toHaveScreenshot(`${name}.png`)
  const hideFixed = await page.addStyleTag({ content: HIDE_FIXED })
  await expect(page).toHaveScreenshot(`${name}-pagina.png`, { fullPage: true })
  await hideFixed.evaluate((element) => element.parentNode?.removeChild(element))
}

async function addToCart(page: Page) {
  await page.goto(NFT_PATH)
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).filter({ visible: true }).first().click()
  await expect(page).toHaveURL(/\/carrinho/)
}

test.describe('regressão visual', () => {
  test.beforeEach(async ({ page }) => {
    await useScenario(page)
  })

  test('início', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#catalogo article')).toHaveCount(9)
    await settle(page)
    await snapshot(page, 'inicio')
  })

  test('detalhe do NFT', async ({ page }) => {
    await page.goto(NFT_PATH)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await settle(page)
    await snapshot(page, 'detalhe')
  })

  test('carrinho', async ({ page }) => {
    await addToCart(page)
    await expect(page.getByRole('heading', { name: /carrinho/i }).first()).toBeVisible()
    await settle(page)
    await snapshot(page, 'carrinho')
  })

  test('pagamento', async ({ page }) => {
    await signIn(page, USERS.ana, NFT_PATH)
    await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).filter({ visible: true }).first().click()
    await expect(page).toHaveURL(/\/carrinho/)
    await page.goto('/pagamento')
    await expect(page.getByRole('button', { name: 'Conectar carteira' })).toBeVisible()
    await settle(page)
    await snapshot(page, 'pagamento')
  })
})
