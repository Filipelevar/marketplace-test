import type { GenericAbortSignal } from 'axios'
import type { ConnectWalletInput, Wallet, WalletConnection, WalletInput } from '@/types/wallets/WalletTypes'
import { API } from '@/services/api'

export async function getWallets(signal?: GenericAbortSignal) {
  const { data } = await API.get<Wallet[]>('/wallets', { signal })
  return data
}

export async function createWallet(input: WalletInput) {
  const { data } = await API.post<Wallet>('/wallets', input)
  return data
}

export async function updateWallet(id: string, input: WalletInput) {
  const { data } = await API.patch<Wallet>(`/wallets/${id}`, input)
  return data
}

export async function connectWallet(walletId: string, input: ConnectWalletInput) {
  const { data } = await API.post<WalletConnection>(`/wallets/${walletId}/connect`, input)
  return data
}

export async function disconnectWallet(connectionId: string) {
  await API.delete(`/wallet-connections/${connectionId}`)
}
