import { http, HttpResponse } from 'msw'
import { addCartItemSchema, applyCouponSchema, updateCartItemSchema } from '@/contracts/cart'
import { authenticate, identifyRequester } from '@/mocks/auth'
import { apiError, readJson, validationError } from '@/mocks/http'
import { CART_ID_HEADER, buildCart, checkCoupon, editionLimit, lineId, resolveCart, touch } from '@/mocks/store/cart'
import { commit, getDb, type CartRecord } from '@/mocks/store/db'
import { parseEth } from '@/lib/eth'

function cartResponse(cart: CartRecord, status = 200) {
  return HttpResponse.json(buildCart(cart), { status })
}

function quantityConflict(limit: number) {
  return limit === 0
    ? apiError('CONFLICT', 'Esta edição está esgotada.')
    : apiError('CONFLICT', `Quantidade indisponível. O máximo para esta edição é ${limit}.`)
}

export const cartHandlers = [
  http.get('/api/cart', ({ request }) => {
    const requester = identifyRequester(request)
    if (!requester.ok) return requester.response
    return cartResponse(resolveCart(request, requester.user))
  }),

  http.post('/api/cart/items', async ({ request }) => {
    const parsed = addCartItemSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationError(parsed.error)
    const { nftId, editionId, quantity } = parsed.data

    const nft = getDb().nfts[nftId]
    if (!nft || !nft.editions.some((edition) => edition.id === editionId)) {
      return apiError('NOT_FOUND', 'NFT ou edição não encontrados.')
    }

    const requester = identifyRequester(request)
    if (!requester.ok) return requester.response
    const cart = resolveCart(request, requester.user)
    const existing = cart.items.find((line) => line.nftId === nftId && line.editionId === editionId)
    const limit = editionLimit(nftId, editionId)
    const nextQuantity = (existing?.quantity ?? 0) + quantity
    if (nextQuantity > limit) return quantityConflict(limit)

    commit((state) => {
      const target = state.carts[cart.id] ?? cart
      const line = target.items.find((item) => item.nftId === nftId && item.editionId === editionId)
      if (line) line.quantity = nextQuantity
      else target.items.push({ nftId, editionId, quantity })
      touch(target)
      state.carts[cart.id] = target
    })
    return cartResponse(getDb().carts[cart.id] ?? cart, 201)
  }),

  http.patch('/api/cart/items/:itemId', async ({ request, params }) => {
    const parsed = updateCartItemSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationError(parsed.error)

    const requester = identifyRequester(request)
    if (!requester.ok) return requester.response
    const cart = resolveCart(request, requester.user)
    const line = cart.items.find((item) => lineId(item.nftId, item.editionId) === params.itemId)
    if (!line) return apiError('NOT_FOUND', 'Item não encontrado no carrinho.')
    const limit = editionLimit(line.nftId, line.editionId)
    if (parsed.data.quantity > limit) return quantityConflict(limit)

    commit((state) => {
      line.quantity = parsed.data.quantity
      touch(cart)
      state.carts[cart.id] = cart
    })
    return cartResponse(cart)
  }),

  http.delete('/api/cart/items/:itemId', ({ request, params }) => {
    const requester = identifyRequester(request)
    if (!requester.ok) return requester.response
    const cart = resolveCart(request, requester.user)
    commit((state) => {
      cart.items = cart.items.filter((item) => lineId(item.nftId, item.editionId) !== params.itemId)
      if (cart.items.length === 0) cart.couponCode = null
      touch(cart)
      state.carts[cart.id] = cart
    })
    return cartResponse(cart)
  }),

  http.post('/api/cart/coupon', async ({ request }) => {
    const parsed = applyCouponSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationError(parsed.error)

    const requester = identifyRequester(request)
    if (!requester.ok) return requester.response
    const cart = resolveCart(request, requester.user)
    const subtotalWei = parseEth(buildCart(cart).totals.subtotalEth)
    const check = checkCoupon(parsed.data.code, subtotalWei)
    if (!check.ok) return apiError('VALIDATION_ERROR', check.message, { code: check.message })

    commit((state) => {
      cart.couponCode = parsed.data.code.toUpperCase()
      touch(cart)
      state.carts[cart.id] = cart
    })
    return cartResponse(cart)
  }),

  http.delete('/api/cart/coupon', ({ request }) => {
    const requester = identifyRequester(request)
    if (!requester.ok) return requester.response
    const cart = resolveCart(request, requester.user)
    commit((state) => {
      cart.couponCode = null
      touch(cart)
      state.carts[cart.id] = cart
    })
    return cartResponse(cart)
  }),

  http.post('/api/cart/merge', ({ request }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response

    const userCart = resolveCart(request, auth.user)
    const guestId = request.headers.get(CART_ID_HEADER)
    const guestCart = guestId ? getDb().carts[guestId] : undefined
    if (!guestCart || guestCart.ownerUserId !== null || guestCart.id === userCart.id) return cartResponse(userCart)

    commit((state) => {
      for (const guestLine of guestCart.items) {
        const limit = editionLimit(guestLine.nftId, guestLine.editionId)
        const line = userCart.items.find((item) => item.nftId === guestLine.nftId && item.editionId === guestLine.editionId)
        if (line) line.quantity = Math.min(limit, line.quantity + guestLine.quantity)
        else if (limit > 0) userCart.items.push({ ...guestLine, quantity: Math.min(limit, guestLine.quantity) })
      }
      userCart.couponCode ??= guestCart.couponCode
      touch(userCart)
      state.carts[userCart.id] = userCart
      delete state.carts[guestCart.id]
    })
    return cartResponse(userCart)
  }),
]
