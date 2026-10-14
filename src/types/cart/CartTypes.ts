import { z } from 'zod'
import type { EthString } from '@/lib/eth'
import type { NftImage, NftSummary } from './nft'

export const NETWORK_FEE_ETH = '0.016'

export const addCartItemSchema = z.object({
  nftId: z.string().min(1),
  editionId: z.string().min(1),
  quantity: z.number().int().min(1),
})

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1),
})

export const applyCouponSchema = z.object({
  code: z.string().trim().min(1, 'Informe um código promocional.').max(32),
})

export type AddCartItemInput = z.infer<typeof addCartItemSchema>
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>

export type CartItem = {
  id: string
  nftId: string
  editionId: string
  editionLabel: string
  name: string
  tokenId: string
  image: NftImage
  unitPriceEth: EthString
  quantity: number
  available: number
  maxQuantity: number
  lineTotalEth: EthString
}

export type AppliedCoupon = {
  code: string
  description: string
}

export type CartTotals = {
  subtotalEth: EthString
  discountEth: EthString
  networkFeeEth: EthString
  totalEth: EthString
}

export type Cart = {
  id: string
  owner: 'guest' | 'user'
  items: CartItem[]
  coupon: AppliedCoupon | null
  totals: CartTotals
  itemCount: number
  updatedAt: string
}

export type FavoritesResponse = {
  items: NftSummary[]
}
