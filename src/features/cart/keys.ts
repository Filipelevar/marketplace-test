export const GUEST_CART_OWNER = 'guest'

export const cartKeys = {
  all: ['cart'] as const,
  owner: (owner: string) => [...cartKeys.all, owner] as const,
}
