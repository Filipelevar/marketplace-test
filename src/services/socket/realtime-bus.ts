import type { EthString } from '@/utils/EthUtils'

export type CartPriceNotice = {
  nftId: string
  name: string
  previousPriceEth: EthString
  priceEth: EthString
  availabilityChanged: boolean
}

export type RealtimeNotice =
  | { type: 'nft-updated'; nftId: string; cartNotice: CartPriceNotice | null }
  | { type: 'reconciled' }

type Listener = (notice: RealtimeNotice) => void

const listeners = new Set<Listener>()

export function publishRealtimeNotice(notice: RealtimeNotice) {
  for (const listener of listeners) listener(notice)
}

export function onRealtimeNotice(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
