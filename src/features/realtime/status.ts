import { useSyncExternalStore } from 'react'

export type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'disconnected'

let status: RealtimeStatus = 'idle'
const listeners = new Set<() => void>()

export function getRealtimeStatus() {
  return status
}

export function setRealtimeStatus(next: RealtimeStatus) {
  if (status === next) return
  status = next
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useRealtimeStatus() {
  return useSyncExternalStore(subscribe, getRealtimeStatus)
}
