import type { CatalogSearch } from '@/types/nfts/NftTypes'

export const GUEST_CART_OWNER = 'guest'

export const nftKeys = {
  all: ['nfts'] as const,
  lists: () => [...nftKeys.all, 'list'] as const,
  list: (search: CatalogSearch) => [...nftKeys.lists(), search] as const,
  details: () => [...nftKeys.all, 'detail'] as const,
  detail: (id: string) => [...nftKeys.details(), id] as const,
  related: (id: string) => [...nftKeys.detail(id), 'related'] as const,
  featured: () => [...nftKeys.all, 'featured'] as const,
}

export const sessionKeys = {
  current: (token: string) => ['session', token] as const,
}

export const cartKeys = {
  all: ['cart'] as const,
  owner: (owner: string) => [...cartKeys.all, owner] as const,
}

export const favoriteKeys = {
  all: ['favorites'] as const,
  user: (userId: string) => [...favoriteKeys.all, userId] as const,
}

export const orderKeys = {
  all: ['orders'] as const,
  user: (userId: string) => [...orderKeys.all, userId] as const,
  detail: (userId: string, orderId: string) => [...orderKeys.user(userId), orderId] as const,
}

export const walletKeys = {
  all: ['wallets'] as const,
  user: (userId: string) => [...walletKeys.all, userId] as const,
}
