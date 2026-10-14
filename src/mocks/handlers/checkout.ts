import { http, HttpResponse } from 'msw'
import { createOrderSchema, IDEMPOTENCY_HEADER } from '@/types/checkout/CheckoutTypes'
import { authenticate } from '@/mocks/auth'
import { apiError, readJson, validationError } from '@/mocks/http'
import {
  buildQuote,
  createPendingOrder,
  orderFingerprint,
  quoteStillValid,
  resolveDueOrders,
  scheduleResolution,
  shouldDropOrderResponse,
  toPublicOrder,
} from '@/mocks/store/checkout'
import { commit, getDb } from '@/mocks/store/db'

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9-]{16,64}$/

export const checkoutHandlers = [
  http.post('/api/checkout/quote', ({ request }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    const quote = buildQuote(request, auth.user.id)
    if (quote.items.length === 0) return apiError('CART_EMPTY', 'Seu carrinho está vazio.')
    return HttpResponse.json(quote)
  }),

  http.post('/api/orders', async ({ request }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response

    const parsed = createOrderSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationError(parsed.error)
    const key = request.headers.get(IDEMPOTENCY_HEADER)
    if (!key || !IDEMPOTENCY_KEY_PATTERN.test(key)) {
      return apiError('VALIDATION_ERROR', 'O cabeçalho Idempotency-Key é obrigatório.')
    }

    const { quoteId, connectionId, collector } = parsed.data
    const fingerprint = orderFingerprint(quoteId, connectionId, collector)
    const scopedKey = `${auth.user.id}:${key}`
    const previous = getDb().idempotency[scopedKey]

    if (previous) {
      if (previous.fingerprint !== fingerprint) {
        return apiError('IDEMPOTENCY_CONFLICT', 'Esta chave de idempotência já foi usada com outro conteúdo.')
      }
      resolveDueOrders()
      const attempts = commit((state) => {
        const record = state.idempotency[scopedKey]
        if (record) record.attempts += 1
        return record?.attempts ?? 1
      })
      const existing = getDb().orders[previous.orderId]
      if (!existing) return apiError('NOT_FOUND', 'Pedido não encontrado.')
      if (shouldDropOrderResponse(attempts)) return HttpResponse.error()
      return HttpResponse.json(toPublicOrder(existing), { status: 200 })
    }

    const connection = getDb().walletConnections[connectionId]
    if (!connection || connection.userId !== auth.user.id) {
      return apiError('WALLET_DISCONNECTED', 'Sua carteira foi desconectada. Conecte-a novamente para continuar.')
    }

    const stored = getDb().quotes[quoteId]
    const current = buildQuote(request, auth.user.id)
    if (current.items.length === 0) return apiError('CART_EMPTY', 'Seu carrinho está vazio.')
    if (!stored || stored.userId !== auth.user.id || !quoteStillValid(stored.quote, current)) {
      return apiError('QUOTE_CHANGED', 'A cotação mudou. Revise os novos valores antes de confirmar.', undefined, {
        quote: current,
      })
    }

    const order = createPendingOrder(auth.user.id, stored.quote, connection, collector)
    commit((state) => {
      state.orders[order.id] = order
      state.idempotency[scopedKey] = { fingerprint, orderId: order.id, attempts: 1 }
    })
    scheduleResolution(order)

    if (shouldDropOrderResponse(1)) return HttpResponse.error()
    return HttpResponse.json(toPublicOrder(order), { status: 201 })
  }),

  http.get('/api/orders', ({ request }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    resolveDueOrders()
    const status = new URL(request.url).searchParams.get('status')
    const orders = Object.values(getDb().orders)
      .filter((order) => order.userId === auth.user.id && (!status || order.status === status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(toPublicOrder)
    return HttpResponse.json(orders)
  }),

  http.get('/api/orders/:id', ({ request, params }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    resolveDueOrders()
    const order = getDb().orders[String(params.id)]
    if (!order || order.userId !== auth.user.id) return apiError('NOT_FOUND', 'Pedido não encontrado.')
    return HttpResponse.json(toPublicOrder(order))
  }),
]
