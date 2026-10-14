import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AddCartItemInput, ApplyCouponInput, Cart } from '@/contracts/cart'
import { http } from '@/lib/http'
import { useSession } from '@/features/auth/api'
import { readGuestCartId, writeGuestCartId } from './cart-id-storage'
import { cartKeys, GUEST_CART_OWNER as GUEST_OWNER } from './keys'

export function cartQuery(owner: string) {
  return queryOptions({
    queryKey: cartKeys.owner(owner),
    queryFn: async ({ signal }) => {
      const { data } = await http.get<Cart>('/cart', { signal })
      if (data.owner === 'guest' && data.id !== readGuestCartId()) writeGuestCartId(data.id)
      return data
    },
    staleTime: 15_000,
  })
}

export function useCartOwner() {
  const session = useSession()
  if (session.status === 'loading') return null
  return session.user?.id ?? GUEST_OWNER
}

export function useCart() {
  const owner = useCartOwner()
  return useQuery({ ...cartQuery(owner ?? GUEST_OWNER), enabled: owner !== null })
}

function useCartMutation<TVariables>(request: (variables: TVariables) => Promise<Cart>) {
  const queryClient = useQueryClient()
  const owner = useCartOwner() ?? GUEST_OWNER
  return useMutation({
    mutationKey: cartKeys.all,
    mutationFn: request,
    onSuccess: (cart) => {
      if (cart.owner === 'guest') writeGuestCartId(cart.id)
      queryClient.setQueryData(cartKeys.owner(owner), cart)
    },
    onError: () => queryClient.invalidateQueries({ queryKey: cartKeys.owner(owner) }),
  })
}

export function useAddToCart() {
  return useCartMutation(async (input: AddCartItemInput) => (await http.post<Cart>('/cart/items', input)).data)
}

export function useUpdateCartItem() {
  return useCartMutation(
    async ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      (await http.patch<Cart>(`/cart/items/${encodeURIComponent(itemId)}`, { quantity })).data,
  )
}

export function useRemoveCartItem() {
  return useCartMutation(
    async (itemId: string) => (await http.delete<Cart>(`/cart/items/${encodeURIComponent(itemId)}`)).data,
  )
}

export function useApplyCoupon() {
  return useCartMutation(async (input: ApplyCouponInput) => (await http.post<Cart>('/cart/coupon', input)).data)
}

export function useRemoveCoupon() {
  return useCartMutation(async () => (await http.delete<Cart>('/cart/coupon')).data)
}
