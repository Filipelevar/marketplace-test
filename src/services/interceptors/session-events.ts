type SessionEvent = { type: 'expired' }
type Listener = (event: SessionEvent) => void

const listeners = new Set<Listener>()

export function emitSessionEvent(event: SessionEvent) {
  for (const listener of listeners) listener(event)
}

export function onSessionEvent(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
