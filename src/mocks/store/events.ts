import type { NftRecord } from '@/mocks/fixtures/nfts'
import type { OrderRecord } from './db'

type NftListener = (nft: NftRecord) => void
type OrderListener = (order: OrderRecord) => void

const nftListeners = new Set<NftListener>()
const orderListeners = new Set<OrderListener>()

export function onNftChanged(listener: NftListener) {
  nftListeners.add(listener)
  return () => nftListeners.delete(listener)
}

export function onOrderChanged(listener: OrderListener) {
  orderListeners.add(listener)
  return () => orderListeners.delete(listener)
}

export function notifyNftChanged(nft: NftRecord) {
  for (const listener of nftListeners) listener(nft)
}

export function notifyOrderChanged(order: OrderRecord) {
  for (const listener of orderListeners) listener(order)
}
