import { z } from 'zod'
import type { EthString } from '@/utils/EthUtils'
import type { AppliedCoupon, CartTotals } from '@/types/cart/CartTypes'
import type { NftImage, NetworkSlug } from '@/types/nfts/NftTypes'
import type { WalletProvider } from '@/types/wallets/WalletTypes'

export const QUOTE_TTL_MS = 5 * 60_000
export const IDEMPOTENCY_HEADER = 'Idempotency-Key'

export type QuoteItem = {
  id: string
  nftId: string
  editionId: string
  editionLabel: string
  name: string
  tokenId: string
  image: NftImage
  unitPriceEth: EthString
  quantity: number
  lineTotalEth: EthString
}

export type QuoteIssue = {
  itemId: string
  name: string
  kind: 'sold-out' | 'insufficient'
  available: number
}

export type CheckoutQuote = {
  id: string
  items: QuoteItem[]
  coupon: AppliedCoupon | null
  totals: CartTotals
  issues: QuoteIssue[]
  createdAt: string
  expiresAt: string
}

export const collectorSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe seu nome de exibição.').max(60),
  username: z
    .string()
    .trim()
    .min(3, 'O nome de usuário deve ter pelo menos 3 caracteres.')
    .max(24)
    .regex(/^[a-z0-9._]+$/, 'Use apenas letras minúsculas, números, ponto ou sublinhado.'),
  email: z.email('Informe um e-mail válido.'),
  referralCode: z
    .string()
    .trim()
    .max(20)
    .regex(/^[A-Za-z0-9-]*$/, 'Use apenas letras, números e hífen.')
    .optional()
    .or(z.literal('')),
  note: z.string().trim().max(280, 'A observação deve ter no máximo 280 caracteres.').optional().or(z.literal('')),
})

export type CollectorInput = z.infer<typeof collectorSchema>

export const createOrderSchema = z.object({
  quoteId: z.string().min(1),
  connectionId: z.string().min(1),
  collector: collectorSchema,
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>

export type OrderStatus = 'pending' | 'confirmed' | 'declined'

export type OrderItem = QuoteItem

export type Order = {
  id: string
  status: OrderStatus
  items: OrderItem[]
  coupon: AppliedCoupon | null
  totals: CartTotals
  wallet: { label: string; address: string; provider: WalletProvider; network: NetworkSlug }
  collector: CollectorInput
  transactionHash: string | null
  blockNumber: number | null
  failureReason: string | null
  createdAt: string
  updatedAt: string
  confirmedAt: string | null
  version: number
}

export function isTerminal(status: OrderStatus) {
  return status !== 'pending'
}
