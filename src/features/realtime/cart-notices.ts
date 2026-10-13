import { useSyncExternalStore } from 'react'
import type { CartPriceNotice } from './bus'

let notices: CartPriceNotice[] = []
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function addCartNotice(notice: CartPriceNotice) {
  notices = [notice, ...notices.filter((item) => item.nftId !== notice.nftId)]
  emit()
}

export function clearCartNotices() {
  notices = []
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useCartNotices() {
  return useSyncExternalStore(subscribe, () => notices)
}
