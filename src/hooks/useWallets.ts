import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ConnectWalletInput, WalletInput } from '@/types/wallets/WalletTypes'
import { connectWallet, createWallet, disconnectWallet, getWallets, updateWallet } from '@/services/wallets/WalletServices'
import { useSession } from '@/hooks/useAuth'
import { walletKeys } from '@/hooks/queryKeys'

export function walletsQuery(userId: string) {
  return queryOptions({
    queryKey: walletKeys.user(userId),
    queryFn: ({ signal }) => getWallets(signal),
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
    mutationFn: ({ id, input }: { id?: string; input: WalletInput }) => (id ? updateWallet(id, input) : createWallet(input)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: walletKeys.user(session.user?.id ?? '') }),
  })
}

export function useConnectWallet() {
  return useMutation({
    mutationFn: ({ walletId, ...input }: ConnectWalletInput & { walletId: string }) => connectWallet(walletId, input),
  })
}

export function useDisconnectWallet() {
  return useMutation({ mutationFn: disconnectWallet })
}
