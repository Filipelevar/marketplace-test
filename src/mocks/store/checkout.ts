import { QUOTE_TTL_MS, type CheckoutQuote, type CollectorInput, type Order, type QuoteIssue } from '@/types/checkout/CheckoutTypes'
import { readMockConfig } from '@/mocks/scenarios'
import { buildCart, resolveCart } from '@/mocks/store/cart'
import { commit, getDb, type OrderRecord, type WalletConnectionRecord } from '@/mocks/store/db'
import { notifyNftChanged, notifyOrderChanged } from '@/mocks/store/events'

export const PAYMENT_PROCESSING_MS = 2500

let nextOutcomeOverride: 'confirmed' | 'declined' | null = null
let dropNextOrderResponse = false

export function setNextOrderOutcome(outcome: 'confirmed' | 'declined') {
  nextOutcomeOverride = outcome
}

export function armDropNextOrderResponse() {
  dropNextOrderResponse = true
}

export function shouldDropOrderResponse(attempts: number) {
  if (dropNextOrderResponse) {
    dropNextOrderResponse = false
    return true
  }
  return readMockConfig().scenario === 'timeout-pedido' && attempts === 1
}

function plannedOutcome(): 'confirmed' | 'declined' {
  if (nextOutcomeOverride) {
    const outcome = nextOutcomeOverride
    nextOutcomeOverride = null
    return outcome
  }
  return readMockConfig().scenario === 'pagamento-recusado' ? 'declined' : 'confirmed'
}

export function buildQuote(request: Request, userId: string): CheckoutQuote {
  const user = getDb().users[userId] ?? null
  const cart = buildCart(resolveCart(request, user))
  const issues = cart.items.flatMap<QuoteIssue>((item) => {
    if (item.available === 0) return [{ itemId: item.id, name: item.name, kind: 'sold-out', available: 0 }]
    if (item.quantity > item.maxQuantity) {
      return [{ itemId: item.id, name: item.name, kind: 'insufficient', available: item.maxQuantity }]
    }
    return []
  })
  const now = Date.now()
  const quote: CheckoutQuote = {
    id: `quote-${crypto.randomUUID()}`,
    items: cart.items.map((item) => ({
      id: item.id,
      nftId: item.nftId,
      editionId: item.editionId,
      editionLabel: item.editionLabel,
      name: item.name,
      tokenId: item.tokenId,
      image: item.image,
      unitPriceEth: item.unitPriceEth,
      quantity: item.quantity,
      lineTotalEth: item.lineTotalEth,
    })),
    coupon: cart.coupon,
    totals: cart.totals,
    issues,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + QUOTE_TTL_MS).toISOString(),
  }
  commit((state) => {
    state.quotes[quote.id] = { userId, quote }
  })
  return quote
}

function signature(quote: CheckoutQuote) {
  return JSON.stringify({
    items: quote.items.map((item) => [item.id, item.unitPriceEth, item.quantity]),
    coupon: quote.coupon?.code ?? null,
    totals: quote.totals,
  })
}

export function quoteStillValid(stored: CheckoutQuote, current: CheckoutQuote) {
  return Date.parse(stored.expiresAt) > Date.now() && current.issues.length === 0 && signature(stored) === signature(current)
}

export function orderFingerprint(quoteId: string, connectionId: string, collector: CollectorInput) {
  return JSON.stringify({ quoteId, connectionId, collector })
}

function randomHex(bytes: number) {
  return [...crypto.getRandomValues(new Uint8Array(bytes))].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function createPendingOrder(
  userId: string,
  quote: CheckoutQuote,
  connection: WalletConnectionRecord,
  collector: CollectorInput,
): OrderRecord {
  const wallet = getDb().wallets[connection.walletId]
  const now = new Date()
  return {
    id: `order-${crypto.randomUUID().slice(0, 8)}`,
    userId,
    status: 'pending',
    items: quote.items,
    coupon: quote.coupon,
    totals: quote.totals,
    wallet: {
      label: wallet?.label ?? 'Carteira',
      address: connection.address,
      provider: connection.provider,
      network: connection.network,
    },
    collector,
    transactionHash: null,
    blockNumber: null,
    failureReason: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    confirmedAt: null,
    version: 1,
    plannedOutcome: plannedOutcome(),
    resolveAt: new Date(now.getTime() + PAYMENT_PROCESSING_MS).toISOString(),
  }
}

function settle(order: OrderRecord) {
  const { nfts, carts } = getDb()
  const insufficient = order.items.find((item) => {
    const edition = nfts[item.nftId]?.editions.find((candidate) => candidate.id === item.editionId)
    return !edition || edition.available < item.quantity
  })
  const now = new Date().toISOString()

  if (order.plannedOutcome === 'declined' || insufficient) {
    order.status = 'declined'
    order.failureReason = insufficient
      ? `A disponibilidade de ${insufficient.name} acabou antes da confirmação.`
      : 'O pagamento foi recusado pela carteira.'
  } else {
    order.status = 'confirmed'
    order.transactionHash = `0x${randomHex(32)}`
    order.blockNumber = 21_000_000 + Math.floor(Math.random() * 500_000)
    order.confirmedAt = now
    const changedNfts = new Set<string>()
    for (const item of order.items) {
      const nft = nfts[item.nftId]
      const edition = nft?.editions.find((candidate) => candidate.id === item.editionId)
      if (!nft || !edition) continue
      edition.available -= item.quantity
      nft.available = nft.editions.reduce((total, current) => total + current.available, 0)
      nft.version += 1
      changedNfts.add(nft.id)
    }
    const cart = Object.values(carts).find((candidate) => candidate.ownerUserId === order.userId)
    if (cart) {
      for (const item of order.items) {
        const line = cart.items.find((candidate) => candidate.nftId === item.nftId && candidate.editionId === item.editionId)
        if (line) line.quantity -= item.quantity
      }
      cart.items = cart.items.filter((line) => line.quantity > 0)
      if (cart.items.length === 0) cart.couponCode = null
      cart.updatedAt = now
    }
    queueMicrotask(() => {
      for (const id of changedNfts) {
        const nft = getDb().nfts[id]
        if (nft) notifyNftChanged(nft)
      }
    })
  }
  order.updatedAt = now
  order.version += 1
}

export function resolveDueOrders(now = Date.now()) {
  const due = Object.values(getDb().orders).filter((order) => order.status === 'pending' && Date.parse(order.resolveAt) <= now)
  if (due.length === 0) return
  commit(() => {
    for (const order of due) settle(order)
  })
  for (const order of due) notifyOrderChanged(order)
}

export function scheduleResolution(order: OrderRecord) {
  setTimeout(() => resolveDueOrders(), Math.max(0, Date.parse(order.resolveAt) - Date.now()) + 50)
}

export function toPublicOrder(record: OrderRecord): Order {
  return {
    id: record.id,
    status: record.status,
    items: record.items,
    coupon: record.coupon,
    totals: record.totals,
    wallet: record.wallet,
    collector: record.collector,
    transactionHash: record.transactionHash,
    blockNumber: record.blockNumber,
    failureReason: record.failureReason,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    confirmedAt: record.confirmedAt,
    version: record.version,
  }
}
