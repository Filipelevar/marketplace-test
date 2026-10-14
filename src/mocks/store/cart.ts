import { NETWORK_FEE_ETH, type AppliedCoupon, type Cart, type CartItem } from '@/types/cart/CartTypes'
import { MAX_QUANTITY_PER_ORDER } from '@/types/nfts/NftTypes'
import { formatEth, multiplyEth, parseEth } from '@/utils/EthUtils'
import type { UserRecord } from '@/mocks/fixtures/users'
import { commit, getDb, type CartRecord } from '@/mocks/store/db'

export const CART_ID_HEADER = 'X-Cart-Id'

type Coupon = {
  description: string
  expiresAt: string
  minSubtotalEth?: string
} & ({ kind: 'percent'; percent: number } | { kind: 'fixed'; amountEth: string })

export const COUPONS: Record<string, Coupon> = {
  KURIO10: { kind: 'percent', percent: 10, description: '10% de desconto no subtotal', expiresAt: '2027-12-31T23:59:59.000Z' },
  LANCAMENTO: {
    kind: 'fixed',
    amountEth: '0.05',
    minSubtotalEth: '0.5',
    description: '0.05 ETH de desconto em pedidos a partir de 0.5 ETH',
    expiresAt: '2027-12-31T23:59:59.000Z',
  },
  GENESIS2025: { kind: 'percent', percent: 20, description: '20% de desconto de lançamento', expiresAt: '2025-12-31T23:59:59.000Z' },
}

export type CouponCheck = { ok: true; coupon: Coupon } | { ok: false; reason: 'invalid' | 'expired' | 'minimum'; message: string }

export function checkCoupon(code: string, subtotalWei: bigint, now = Date.now()): CouponCheck {
  const coupon = COUPONS[code.toUpperCase()]
  if (!coupon) return { ok: false, reason: 'invalid', message: 'Cupom inválido.' }
  if (Date.parse(coupon.expiresAt) <= now) return { ok: false, reason: 'expired', message: 'Este cupom expirou.' }
  if (coupon.minSubtotalEth && subtotalWei < parseEth(coupon.minSubtotalEth)) {
    return { ok: false, reason: 'minimum', message: `Este cupom exige subtotal mínimo de ${coupon.minSubtotalEth} ETH.` }
  }
  return { ok: true, coupon }
}

function discountFor(coupon: Coupon, subtotalWei: bigint) {
  const discount = coupon.kind === 'percent' ? (subtotalWei * BigInt(coupon.percent)) / 100n : parseEth(coupon.amountEth)
  return discount > subtotalWei ? subtotalWei : discount
}

export function lineId(nftId: string, editionId: string) {
  return `${nftId}:${editionId}`
}

export function editionLimit(nftId: string, editionId: string) {
  const edition = getDb().nfts[nftId]?.editions.find((item) => item.id === editionId)
  return edition ? Math.min(edition.available, MAX_QUANTITY_PER_ORDER) : 0
}

export function buildCart(record: CartRecord): Cart {
  const { nfts } = getDb()
  const items: CartItem[] = record.items.flatMap((line) => {
    const nft = nfts[line.nftId]
    const edition = nft?.editions.find((item) => item.id === line.editionId)
    if (!nft || !edition) return []
    return [
      {
        id: lineId(line.nftId, line.editionId),
        nftId: nft.id,
        editionId: edition.id,
        editionLabel: edition.label,
        name: nft.name,
        tokenId: nft.tokenId,
        image: nft.image,
        unitPriceEth: nft.priceEth,
        quantity: line.quantity,
        available: edition.available,
        maxQuantity: Math.min(edition.available, MAX_QUANTITY_PER_ORDER),
        lineTotalEth: multiplyEth(nft.priceEth, line.quantity),
      },
    ]
  })

  const subtotalWei = items.reduce((total, item) => total + parseEth(item.lineTotalEth), 0n)
  const couponCheck = record.couponCode ? checkCoupon(record.couponCode, subtotalWei) : null
  const discountWei = couponCheck?.ok ? discountFor(couponCheck.coupon, subtotalWei) : 0n
  const feeWei = items.length > 0 ? parseEth(NETWORK_FEE_ETH) : 0n
  const coupon: AppliedCoupon | null =
    record.couponCode && couponCheck?.ok ? { code: record.couponCode, description: couponCheck.coupon.description } : null

  return {
    id: record.id,
    owner: record.ownerUserId ? 'user' : 'guest',
    items,
    coupon,
    totals: {
      subtotalEth: formatEth(subtotalWei),
      discountEth: formatEth(discountWei),
      networkFeeEth: formatEth(feeWei),
      totalEth: formatEth(subtotalWei - discountWei + feeWei),
    },
    itemCount: items.length,
    updatedAt: record.updatedAt,
  }
}

function createCart(ownerUserId: string | null): CartRecord {
  const cart: CartRecord = {
    id: `cart-${crypto.randomUUID()}`,
    ownerUserId,
    items: [],
    couponCode: null,
    updatedAt: new Date().toISOString(),
  }
  commit((state) => {
    state.carts[cart.id] = cart
  })
  return cart
}

export function resolveCart(request: Request, user: UserRecord | null): CartRecord {
  const { carts } = getDb()
  if (user) {
    return Object.values(carts).find((cart) => cart.ownerUserId === user.id) ?? createCart(user.id)
  }
  const guestId = request.headers.get(CART_ID_HEADER)
  const guestCart = guestId ? carts[guestId] : undefined
  if (guestCart && guestCart.ownerUserId === null) return guestCart
  return createCart(null)
}

export function touch(cart: CartRecord) {
  cart.updatedAt = new Date().toISOString()
}
