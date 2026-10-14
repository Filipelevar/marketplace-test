import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ConnectWalletInput, Wallet, WalletConnection, WalletInput } from '@/contracts/wallet'
import { http } from '@/lib/http'
import { useSession } from '@/features/auth/api'

export const walletKeys = {
  all: ['wallets'] as const,
  user: (userId: string) => [...walletKeys.all, userId] as const,
}

export function walletsQuery(userId: string) {
  return queryOptions({
    queryKey: walletKeys.user(userId),
    queryFn: async ({ signal }) => (await http.get<Wallet[]>('/wallets', { signal })).data,
  })
}

export function useWallets() {
  const session = useSession()
  return useQuery({ ...walletsQuery(session.user?.id ?? ''), enabled: session.status === 'authenticated' })
}

export function useSaveWallet() {
  const queryClient = useQueryClient()
  const session = useSession()
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: WalletInput }) =>
      id ? (await http.patch<Wallet>(`/wallets/${id}`, input)).data : (await http.post<Wallet>('/wallets', input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: walletKeys.user(session.user?.id ?? '') }),
  })
}

export function useConnectWallet() {
  return useMutation({
    mutationFn: async ({ walletId, ...input }: ConnectWalletInput & { walletId: string }) =>
      (await http.post<WalletConnection>(`/wallets/${walletId}/connect`, input)).data,
  })
}

export function useDisconnectWallet() {
  return useMutation({
    mutationFn: async (connectionId: string) => {
      await http.delete(`/wallet-connections/${connectionId}`)
    },
  })
}
