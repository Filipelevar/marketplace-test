import type { GenericAbortSignal } from 'axios'
import { IDEMPOTENCY_HEADER, type CheckoutQuote, type Order } from '@/types/checkout/CheckoutTypes'
import type { CheckoutAttempt } from '@/stores/checkout-store'
import { API } from '@/services/api'

export async function createQuote() {
  const { data } = await API.post<CheckoutQuote>('/checkout/quote')
  return data
}

export async function placeOrder(attempt: CheckoutAttempt) {
  const { data } = await API.post<Order>(
    '/orders',
    { quoteId: attempt.quoteId, connectionId: attempt.connectionId, collector: attempt.collector },
    { headers: { [IDEMPOTENCY_HEADER]: attempt.idempotencyKey } },
  )
  return data
}

export async function getOrderById(orderId: string, signal?: GenericAbortSignal) {
  const { data } = await API.get<Order>(`/orders/${encodeURIComponent(orderId)}`, { signal })
  return data
}
