const CART_ID_KEY = 'kurio:guest-cart-id'

export function readGuestCartId(): string | null {
  return localStorage.getItem(CART_ID_KEY)
}

export function writeGuestCartId(cartId: string) {
  localStorage.setItem(CART_ID_KEY, cartId)
}

export function clearGuestCartId() {
  localStorage.removeItem(CART_ID_KEY)
}
