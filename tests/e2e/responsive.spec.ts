import { expect, test } from '@playwright/test'
import { useScenario } from '../support/mock-scenario.ts'

const PAGES = [
  { path: '/', ready: 'Emerald Ape #042' },
  { path: '/nfts/emerald-ape-042', ready: 'Emerald Ape #042' },
  { path: '/nfts/nao-existe', ready: 'NFT não encontrado' },
  { path: '/em-breve?secao=criadores', ready: 'Criadores não faz parte desta demonstração' },
  { path: '/rota-inexistente', ready: 'Página não encontrada' },
]

const WIDTHS = [390, 768, 1440]

test.describe('responsividade', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  for (const { path, ready } of PAGES) {
    test(`sem overflow horizontal em ${path}`, async ({ page }) => {
      await useScenario(page)
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(path)
        await expect(page.getByText(ready).first()).toBeVisible()
        await page.waitForLoadState('networkidle')
        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }))
        expect(scrollWidth, `largura ${width}px`).toBeLessThanOrEqual(clientWidth)
      }
    })
  }
})
