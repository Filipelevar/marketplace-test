import type { QueryClient } from '@tanstack/react-query'
import type { Cart, FavoritesResponse } from '@/contracts/cart'
import type { Order } from '@/contracts/checkout'
import type { FeaturedNftsResponse, NftDetail, NftListResponse, NftSummary } from '@/contracts/nft'
import type { NftUpdatedEvent, OrderUpdatedEvent, RealtimeEvent } from '@/contracts/realtime'
import { cartKeys } from '@/features/cart/keys'
import { nftKeys } from '@/features/catalog/api'
import { favoriteKeys } from '@/features/favorites/keys'
import { orderKeys } from '@/features/checkout/keys'
import type { CartPriceNotice } from './bus'

const MAX_REMEMBERED_EVENTS = 500

export function createEventGate() {
  const seen = new Set<string>()
  const latestVersion = new Map<string, number>()

  return function accept(event: RealtimeEvent) {
    if (seen.has(event.id)) return false
    const key = `${event.resource.type}:${event.resource.id}`
    if ((latestVersion.get(key) ?? 0) >= event.version) return false
    seen.add(event.id)
    latestVersion.set(key, event.version)
    if (seen.size > MAX_REMEMBERED_EVENTS) {
      const oldest = seen.values().next().value
      if (oldest) seen.delete(oldest)
    }
    return true
  }
}

function patchSummary<T extends NftSummary>(nft: T, event: NftUpdatedEvent): T {
  if (nft.id !== event.resource.id || nft.version >= event.version) return nft
  return { ...nft, priceEth: event.data.priceEth, available: event.data.available, version: event.version }
}

function patchDetail(nft: NftDetail, event: NftUpdatedEvent): NftDetail {
  if (nft.id !== event.resource.id || nft.version >= event.version) return nft
  return {
    ...patchSummary(nft, event),
    editions: nft.editions.map((edition) => {
      const next = event.data.editions.find((candidate) => candidate.id === edition.id)
      return next ? { ...edition, available: next.available } : edition
    }),
  }
}

function isDetail(value: unknown): value is NftDetail {
  return typeof value === 'object' && value !== null && 'editions' in value && 'id' in value
}

export function applyNftUpdate(queryClient: QueryClient, event: NftUpdatedEvent): CartPriceNotice | null {
  queryClient.setQueriesData<NftListResponse>({ queryKey: nftKeys.lists() }, (data) =>
    data ? { ...data, items: data.items.map((item) => patchSummary(item, event)) } : data,
  )
  queryClient.setQueriesData<NftDetail | NftSummary[]>({ queryKey: nftKeys.details() }, (data) => {
    if (Array.isArray(data)) return data.map((item) => patchSummary(item, event))
    if (isDetail(data)) return patchDetail(data, event)
    return data
  })
  queryClient.setQueryData<FeaturedNftsResponse>(nftKeys.featured(), (data) =>
    data ? { hero: data.hero.map((item) => patchSummary(item, event)), spotlight: patchSummary(data.spotlight, event) } : data,
  )
  queryClient.setQueriesData<FavoritesResponse>({ queryKey: favoriteKeys.all }, (data) =>
    data ? { items: data.items.map((item) => patchSummary(item, event)) } : data,
  )

  let notice: CartPriceNotice | null = null
  for (const [, cart] of queryClient.getQueriesData<Cart>({ queryKey: cartKeys.all })) {
    const line = cart?.items.find((item) => item.nftId === event.resource.id)
    if (!line) continue
    const edition = event.data.editions.find((candidate) => candidate.id === line.editionId)
    notice = {
      nftId: line.nftId,
      name: line.name,
      previousPriceEth: line.unitPriceEth,
      priceEth: event.data.priceEth,
      availabilityChanged: edition !== undefined && edition.available !== line.available,
    }
  }
  if (notice) void queryClient.invalidateQueries({ queryKey: cartKeys.all })
  return notice
}

export function applyOrderUpdate(queryClient: QueryClient, userId: string, event: OrderUpdatedEvent) {
  const key = orderKeys.detail(userId, event.resource.id)
  const cached = queryClient.getQueryData<Order>(key)
  if (!cached) {
    void queryClient.invalidateQueries({ queryKey: orderKeys.user(userId) })
    return
  }
  if (cached.version >= event.version || cached.status !== 'pending') return
  queryClient.setQueryData<Order>(key, { ...cached, ...event.data, version: event.version })
}

export function reconcileWithRest(queryClient: QueryClient) {
  for (const queryKey of [nftKeys.all, cartKeys.all, orderKeys.all, favoriteKeys.all]) {
    void queryClient.invalidateQueries({ queryKey, refetchType: 'active' }, { cancelRefetch: false })
  }
}
