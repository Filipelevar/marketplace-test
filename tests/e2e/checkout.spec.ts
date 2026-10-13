import { expect, test, type Page } from '@playwright/test'
import { failNext, signIn, USERS } from '../support/auth.ts'
import { useScenario } from '../support/mock-scenario.ts'

async function devPost(page: Page, path: string, body: unknown = {}, method = 'POST') {
  await page.evaluate(
    async ({ path, body, method }) => {
      await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    },
    { path, body, method },
  )
}

async function apiAsUser<T>(page: Page, path: string, init: { method?: string; body?: unknown; headers?: Record<string, string> } = {}) {
  return page.evaluate(
    async ({ path, init }) => {
      const session = JSON.parse(localStorage.getItem('kurio:session') ?? '{}') as { token?: string }
      const res = await fetch(path, {
        method: init.method ?? 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token ?? ''}`, ...init.headers },
        body: init.body ? JSON.stringify(init.body) : undefined,
      })
      return { status: res.status, body: (await res.json().catch(() => null)) as T }
    },
    { path, init },
  )
}

async function goToCheckoutWith(page: Page, nftPath: string) {
  await signIn(page, USERS.ana, nftPath)
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).filter({ visible: true }).first().click()
  await expect(page).toHaveURL(/\/carrinho$/)
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await expect(page).toHaveURL(/\/pagamento$/)
}

async function connectAndReview(page: Page) {
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText(/Conectada via MetaMask/)).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  const dialog = page.getByRole('dialog', { name: 'Revisar pedido' })
  await expect(dialog).toBeVisible()
  return dialog
}

test.describe('checkout', () => {
  test.beforeEach(async ({ page }) => {
    await useScenario(page)
  })

  test('compra completa do catálogo ao recibo confirmado', async ({ page }) => {
    await goToCheckoutWith(page, '/nfts/sage-nomad-009')
    const dialog = await connectAndReview(page)
    await expect(dialog.getByText('1.706 ETH')).toBeVisible()
    await dialog.getByRole('button', { name: 'Confirmar pagamento' }).click()

    await expect(page).toHaveURL(/\/pedidos\/order-/)
    await expect(page.getByRole('heading', { name: 'Processando pagamento' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 10_000 })
    const receipt = page.getByRole('region', { name: 'Seus NFTs agora estão na sua carteira' })
    await expect(receipt.getByText('Sage Nomad #009')).toBeVisible()
    await expect(receipt.getByText('1.706 ETH').first()).toBeVisible()

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()

    await page.goto('/carrinho')
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
    await page.goto('/nfts/sage-nomad-009')
    await expect(page.getByText('Restam apenas')).toHaveCount(0)
  })

  test('pagamento recusado mantém os itens no carrinho', async ({ page }) => {
    await goToCheckoutWith(page, '/nfts/ivory-baron-088')
    await devPost(page, '/api/__dev/orders/next-outcome', { outcome: 'declined' })
    const dialog = await connectAndReview(page)
    await dialog.getByRole('button', { name: 'Confirmar pagamento' }).click()

    await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('O pagamento foi recusado pela carteira.')).toBeVisible()
    await page.getByRole('link', { name: 'Ver carrinho' }).click()
    await expect(page.getByRole('group', { name: 'Quantidade de Ivory Baron #088' }).filter({ visible: true })).toBeVisible()
  })

  test('timeout após a criação recupera o mesmo pedido e cliques repetidos não duplicam', async ({ page }) => {
    await goToCheckoutWith(page, '/nfts/golden-beat-207')
    await devPost(page, '/api/__dev/orders/drop-next-response')
    const dialog = await connectAndReview(page)
    await dialog.getByRole('button', { name: 'Confirmar pagamento' }).dblclick()

    await expect(page).toHaveURL(/\/pedidos\/order-/, { timeout: 10_000 })
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 10_000 })

    const orders = await apiAsUser<unknown[]>(page, '/api/orders')
    expect(orders.status).toBe(200)
    expect(orders.body).toHaveLength(1)
  })

  test('mudança de preço exige confirmação da nova cotação', async ({ page }) => {
    await goToCheckoutWith(page, '/nfts/sage-nomad-009')
    const dialog = await connectAndReview(page)
    await devPost(page, '/api/__dev/nfts/sage-nomad-009', { priceEth: '2.10' }, 'PATCH')

    await dialog.getByRole('button', { name: 'Confirmar pagamento' }).click()
    await expect(dialog.getByRole('alert').filter({ hasText: 'A cotação mudou' })).toBeVisible()
    await expect(dialog.getByText('Sage Nomad #009: preço de 1.69 ETH para 2.10 ETH.')).toBeVisible()
    await expect(dialog.getByText('2.116 ETH').first()).toBeVisible()

    await dialog.getByRole('button', { name: 'Confirmar com novos valores' }).click()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('2.116 ETH').first()).toBeVisible()
  })

  test('recusa e desconexão da carteira', async ({ page }) => {
    await goToCheckoutWith(page, '/nfts/sage-nomad-009')
    await failNext(page, 'POST', '/api/wallets/', {
      status: 403,
      code: 'WALLET_REJECTED',
      message: 'Conexão recusada na carteira.',
    })
    await page.getByRole('button', { name: 'Conectar carteira' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Conexão recusada na carteira.' })).toBeVisible()

    await page.getByRole('button', { name: 'Conectar carteira' }).click()
    await expect(page.getByText(/Conectada via MetaMask/)).toBeVisible()
    await page.getByRole('button', { name: 'Desconectar' }).click()
    await expect(page.getByRole('button', { name: 'Conectar carteira' })).toBeVisible()

    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Conecte a carteira selecionada' })).toBeVisible()
  })

  test('chave de idempotência reutilizada com outro conteúdo gera conflito', async ({ page }) => {
    await goToCheckoutWith(page, '/nfts/sage-nomad-009')
    await page.getByRole('button', { name: 'Conectar carteira' }).click()
    await expect(page.getByText(/Conectada via MetaMask/)).toBeVisible()
    const connectionId = await page.evaluate(() => (JSON.parse(sessionStorage.getItem('kurio:wallet-connection') ?? '{}') as { id: string }).id)
    const quote = await apiAsUser<{ id: string }>(page, '/api/checkout/quote', { method: 'POST' })
    const key = 'teste-idempotencia-0001'
    const collector = { displayName: 'Ana', username: 'ana.coleciona', email: 'ana@kurio.dev' }

    const first = await apiAsUser<{ id: string }>(page, '/api/orders', {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: { quoteId: quote.body.id, connectionId, collector },
    })
    const replay = await apiAsUser<{ id: string }>(page, '/api/orders', {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: { quoteId: quote.body.id, connectionId, collector },
    })
    const conflict = await apiAsUser<{ code: string }>(page, '/api/orders', {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: { quoteId: quote.body.id, connectionId, collector: { ...collector, displayName: 'Outra' } },
    })

    expect(first.status).toBe(201)
    expect(replay.status).toBe(200)
    expect(replay.body.id).toBe(first.body.id)
    expect(conflict.status).toBe(409)
    expect(conflict.body.code).toBe('IDEMPOTENCY_CONFLICT')
  })
})
