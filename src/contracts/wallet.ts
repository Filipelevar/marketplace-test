import { z } from 'zod'
import type { NetworkSlug } from './nft'

export const WALLET_PROVIDERS = [
  { slug: 'metamask', label: 'MetaMask' },
  { slug: 'walletconnect', label: 'WalletConnect' },
  { slug: 'coinbase', label: 'Coinbase Wallet' },
] as const

export type WalletProvider = (typeof WALLET_PROVIDERS)[number]['slug']

const providerSlugs = WALLET_PROVIDERS.map((item) => item.slug) as [WalletProvider, ...WalletProvider[]]
const networkSlugs = ['ethereum', 'polygon', 'solana'] as const

export const walletAddressSchema = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Informe um endereço 0x com 40 caracteres hexadecimais.')

export const walletInputSchema = z.object({
  label: z.string().trim().min(2, 'Informe um apelido com pelo menos 2 caracteres.').max(40),
  address: walletAddressSchema,
  network: z.enum(networkSlugs, 'Selecione uma rede.'),
  provider: z.enum(providerSlugs, 'Selecione o tipo de carteira.'),
  ensName: z
    .string()
    .trim()
    .max(40)
    .regex(/^([a-z0-9-]+\.eth)?$/, 'Use um nome ENS terminado em .eth.')
    .optional()
    .or(z.literal('')),
  role: z.enum(['primary', 'secondary']),
})

export type WalletInput = z.infer<typeof walletInputSchema>

export type Wallet = {
  id: string
  label: string
  address: string
  network: NetworkSlug
  provider: WalletProvider
  ensName: string | null
  role: 'primary' | 'secondary'
  createdAt: string
  updatedAt: string
}

export const connectWalletSchema = z.object({
  provider: z.enum(providerSlugs),
  network: z.enum(networkSlugs),
})

export type ConnectWalletInput = z.infer<typeof connectWalletSchema>

export type WalletConnection = {
  id: string
  walletId: string
  provider: WalletProvider
  network: NetworkSlug
  address: string
  connectedAt: string
}

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}
