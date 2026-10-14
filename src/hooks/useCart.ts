import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Cart } from '@/types/cart/CartTypes'
import { addCartItem, applyCoupon, getCart, removeCartItem, removeCoupon, updateCartItem } from '@/services/cart/CartServices'
import { readGuestCartId, writeGuestCartId } from '@/stores/guest-cart-store'
import { useSession } from '@/hooks/useAuth'
import { cartKeys, GUEST_CART_OWNER } from '@/hooks/queryKeys'

export function cartQuery(owner: string) {
  return queryOptions({
    queryKey: cartKeys.owner(owner),
    queryFn: async ({ signal }) => {
      const cart = await getCart(signal)
      if (cart.owner === 'guest' && cart.id !== readGuestCartId()) writeGuestCartId(cart.id)
      return cart
    },
    staleTime: 15_000,
  })
}

export function useCartOwner() {
  const session = useSession()
  if (session.status === 'loading') return null
  return session.user?.id ?? GUEST_CART_OWNER
}

export function useCart() {
  const owner = useCartOwner()
  return useQuery({ ...cartQuery(owner ?? GUEST_CART_OWNER), enabled: owner !== null })
}

function useCartMutation<TVariables>(request: (variables: TVariables) => Promise<Cart>) {
  const queryClient = useQueryClient()
  const owner = useCartOwner() ?? GUEST_CART_OWNER
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
  return useCartMutation(addCartItem)
}

export function useUpdateCartItem() {
  return useCartMutation(updateCartItem)
}

export function useRemoveCartItem() {
  return useCartMutation(removeCartItem)
}

export function useApplyCoupon() {
  return useCartMutation(applyCoupon)
}

export function useRemoveCoupon() {
  return useCartMutation(() => removeCoupon())
}
