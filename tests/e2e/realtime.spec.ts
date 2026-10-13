import { expect, test, type Page } from '@playwright/test'
import { signIn, signOut, USERS } from '../support/auth.ts'
import { useScenario } from '../support/mock-scenario.ts'
import { dropSocket, emitSocketEvent, nftEvent, patchNft, waitForSocket } from '../support/realtime.ts'

const cardPrice = (page: Page, name: string) =>
  page.locator('#catalogo article').filter({ hasText: name }).locator('p').first()

async function buyNow(page: Page, nftPath: string) {
  await signIn(page, USERS.ana, nftPath)
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).filter({ visible: true }).first().click()
  await page.goto('/pagamento')
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText(/Conectada via MetaMask/)).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  const dialog = page.getByRole('dialog', { name: 'Revisar pedido' })
  await expect(dialog).toBeVisible()
  await waitForSocket(page)
  return dialog
}

test.describe('tempo real', () => {
  test.beforeEach(async ({ page }) => {
    await useScenario(page)
  })

  test('nft.updated atualiza catálogo, detalhe e carrinho sem recarregar', async ({ page }) => {
    await page.goto('/')
    await expect(cardPrice(page, 'Sage Nomad #009')).toContainText('1.69 ETH')
    await waitForSocket(page)
    await patchNft(page, 'sage-nomad-009', { priceEth: '2.10' })
    await expect(cardPrice(page, 'Sage Nomad #009')).toContainText('2.10 ETH')

    await page.goto('/nfts/sage-nomad-009?edition=1-10')
    await expect(page.getByText('Restam apenas 3 unidades desta edição.').first()).toBeVisible()
    await waitForSocket(page)
    await patchNft(page, 'sage-nomad-009', { editionAvailability: { '1-10': 1 } })
    await expect(page.getByText('Restam apenas 1 unidade desta edição.').first()).toBeVisible()

    await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).filter({ visible: true }).first().click()
    await expect(page).toHaveURL(/\/carrinho$/)
    await expect(page.getByRole('group', { name: 'Quantidade de Sage Nomad #009' }).filter({ visible: true })).toBeVisible()
    await waitForSocket(page)
    await patchNft(page, 'sage-nomad-009', { priceEth: '2.50' })
    const notices = page.getByRole('region', { name: 'Alterações no carrinho' })
    await expect(notices).toContainText('preço atualizado de 2.10 ETH para 2.50 ETH')
    await expect(page.getByRole('region', { name: 'Resumo da carteira' }).getByText('2.516 ETH')).toBeVisible()
  })

  test('eventos duplicados ou antigos não regridem o estado', async ({ page }) => {
    await page.goto('/')
    await expect(cardPrice(page, 'Sage Nomad #009')).toContainText('1.69 ETH')
    await waitForSocket(page)

    const fresh = nftEvent('sage-nomad-009', 5, '3.00')
    expect(await emitSocketEvent(page, 'nft.updated', fresh)).toBe(1)
    await expect(cardPrice(page, 'Sage Nomad #009')).toContainText('3.00 ETH')

    await emitSocketEvent(page, 'nft.updated', { ...fresh, data: { ...fresh.data, priceEth: '7.77' } })
    await emitSocketEvent(page, 'nft.updated', nftEvent('sage-nomad-009', 4, '9.99'))
    await emitSocketEvent(page, 'nft.updated', { malformed: true })
    await page.waitForTimeout(500)
    await expect(cardPrice(page, 'Sage Nomad #009')).toContainText('3.00 ETH')
  })

  test('cotação desatualizada por nft.updated bloqueia a confirmação até ser atualizada', async ({ page }) => {
    const dialog = await buyNow(page, '/nfts/sage-nomad-009')
    await patchNft(page, 'sage-nomad-009', { priceEth: '2.10' })

    await expect(dialog.getByText('Os preços ou a disponibilidade mudaram enquanto você revisava')).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Confirmar pagamento' })).toBeDisabled()

    await dialog.getByRole('button', { name: 'Atualizar cotação' }).click()
    await expect(dialog.getByText('Sage Nomad #009: preço de 1.69 ETH para 2.10 ETH.')).toBeVisible()
    await dialog.getByRole('button', { name: 'Confirmar com novos valores' }).click()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
    await expect(page.getByText('2.116 ETH').first()).toBeVisible()
  })

  test('order.updated confirma o pedido pelo socket, sem polling REST', async ({ page }) => {
    const dialog = await buyNow(page, '/nfts/golden-beat-207')
    let orderPolls = 0
    page.on('request', (request) => {
      if (/\/api\/orders\/order-/.test(request.url()) && request.method() === 'GET') orderPolls += 1
    })
    await dialog.getByRole('button', { name: 'Confirmar pagamento' }).click()
    await expect(page.getByRole('heading', { name: 'Processando pagamento' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
    expect(orderPolls).toBeLessThanOrEqual(1)
  })

  test('desconexão durante pedido pendente é reconciliada pelo REST ao reconectar', async ({ page }) => {
    const dialog = await buyNow(page, '/nfts/ivory-baron-088')
    await dialog.getByRole('button', { name: 'Confirmar pagamento' }).click()
    await expect(page.getByRole('heading', { name: 'Processando pagamento' })).toBeVisible()

    await dropSocket(page)
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 15_000 })

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
  })

  test('troca de usuário encerra o socket anterior e isola os eventos', async ({ page }) => {
    await signIn(page, USERS.ana)
    await expect.poll(() => emitSocketEvent(page, 'order.updated', { probe: true }, 'user-ana')).toBe(1)

    await signOut(page)
    await signIn(page, USERS.bruno)
    await expect.poll(() => emitSocketEvent(page, 'order.updated', { probe: true }, 'user-bruno')).toBe(1)
    expect(await emitSocketEvent(page, 'order.updated', { probe: true }, 'user-ana')).toBe(0)
  })

  test('mudança de preço com o socket desconectado é barrada pelo servidor (409)', async ({ page }) => {
    const dialog = await buyNow(page, '/nfts/sage-nomad-009')
    await dropSocket(page)
    await patchNft(page, 'sage-nomad-009', { priceEth: '2.10' })

    await dialog.getByRole('button', { name: 'Confirmar pagamento' }).click()
    await expect(dialog.getByRole('alert').filter({ hasText: 'A cotação mudou' })).toBeVisible()
    await expect(dialog.getByText('Sage Nomad #009: preço de 1.69 ETH para 2.10 ETH.')).toBeVisible()
  })
})
