import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { IDEMPOTENCY_HEADER, isTerminal, type CheckoutQuote, type Order } from '@/contracts/checkout'
import { http } from '@/lib/http'
import { useSession } from '@/features/auth/api'
import { cartKeys } from '@/features/cart/keys'
import { nftKeys } from '@/features/catalog/api'
import { useRealtimeStatus } from '@/features/realtime/status'
import { orderKeys } from './keys'
import type { CheckoutAttempt } from './storage'

const ORDER_POLL_INTERVAL_MS = 1500
const MAX_SUBMIT_RETRIES = 3

export { orderKeys }

export function isRecoverableNetworkError(error: unknown) {
  return isAxiosError(error) && (!error.response || error.code === 'ECONNABORTED')
}

export function useCreateQuote() {
  return useMutation({
    mutationFn: async () => (await http.post<CheckoutQuote>('/checkout/quote')).data,
  })
}

export function usePlaceOrder() {
  return useMutation({
    mutationFn: async (attempt: CheckoutAttempt) => {
      const { data } = await http.post<Order>(
        '/orders',
        { quoteId: attempt.quoteId, connectionId: attempt.connectionId, collector: attempt.collector },
        { headers: { [IDEMPOTENCY_HEADER]: attempt.idempotencyKey } },
      )
      return data
    },
    retry: (failureCount, error) => isRecoverableNetworkError(error) && failureCount < MAX_SUBMIT_RETRIES,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
  })
}

export function orderQuery(userId: string, orderId: string) {
  return queryOptions({
    queryKey: orderKeys.detail(userId, orderId),
    queryFn: async ({ signal }) => (await http.get<Order>(`/orders/${encodeURIComponent(orderId)}`, { signal })).data,
  })
}

export function useOrder(orderId: string) {
  const session = useSession()
  const realtime = useRealtimeStatus()
  return useQuery({
    ...orderQuery(session.user?.id ?? '', orderId),
    enabled: session.status === 'authenticated',
    refetchInterval: (query) =>
      query.state.data && !isTerminal(query.state.data.status) && realtime !== 'connected' ? ORDER_POLL_INTERVAL_MS : false,
  })
}

export function useSettleOrderSideEffects() {
  const queryClient = useQueryClient()
  return function onTerminal(order: Order) {
    if (order.status !== 'confirmed') return
    void queryClient.invalidateQueries({ queryKey: cartKeys.all })
    void queryClient.invalidateQueries({ queryKey: nftKeys.all })
  }
}
