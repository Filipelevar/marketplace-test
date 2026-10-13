import type { QueryClient } from '@tanstack/react-query'

export const PRIVATE_QUERY_ROOTS = ['session', 'favorites', 'cart', 'orders', 'wallets', 'profile'] as const

export function clearPrivateData(queryClient: QueryClient) {
  for (const root of PRIVATE_QUERY_ROOTS) {
    void queryClient.cancelQueries({ queryKey: [root] })
    queryClient.removeQueries({ queryKey: [root] })
  }
}
