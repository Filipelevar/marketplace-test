import type { GenericAbortSignal } from 'axios'
import type { AddCartItemInput, ApplyCouponInput, Cart } from '@/types/cart/CartTypes'
import { API } from '@/services/api'

export async function getCart(signal?: GenericAbortSignal) {
  const { data } = await API.get<Cart>('/cart', { signal })
  return data
}

export async function mergeGuestCart() {
  const { data } = await API.post<Cart>('/cart/merge')
  return data
}

export async function addCartItem(input: AddCartItemInput) {
  const { data } = await API.post<Cart>('/cart/items', input)
  return data
}

export async function updateCartItem({ itemId, quantity }: { itemId: string; quantity: number }) {
  const { data } = await API.patch<Cart>(`/cart/items/${encodeURIComponent(itemId)}`, { quantity })
  return data
}

export async function removeCartItem(itemId: string) {
  const { data } = await API.delete<Cart>(`/cart/items/${encodeURIComponent(itemId)}`)
  return data
}

export async function applyCoupon(input: ApplyCouponInput) {
  const { data } = await API.post<Cart>('/cart/coupon', input)
  return data
}

export async function removeCoupon() {
  const { data } = await API.delete<Cart>('/cart/coupon')
  return data
}
