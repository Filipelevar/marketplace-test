import { useSyncExternalStore } from 'react'

const SESSION_KEY = 'kurio:session'

export type StoredSession = {
  token: string
  expiresAt: string
}

const listeners = new Set<() => void>()
let cachedRaw: string | null = null
let cachedSession: StoredSession | null = null

function parse(raw: string | null): StoredSession | null {
  if (!raw) return null
  try {
    const value: unknown = JSON.parse(raw)
    if (
      typeof value === 'object' &&
      value !== null &&
      'token' in value &&
      typeof value.token === 'string' &&
      'expiresAt' in value &&
      typeof value.expiresAt === 'string'
    ) {
      return { token: value.token, expiresAt: value.expiresAt }
    }
  } catch {
    return null
  }
  return null
}

export function readStoredSession(): StoredSession | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedSession = parse(raw)
  }
  return cachedSession
}

function notify() {
  for (const listener of listeners) listener()
}

export function writeStoredSession(session: StoredSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  notify()
}

export function clearStoredSession() {
  localStorage.removeItem(SESSION_KEY)
  notify()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === SESSION_KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function useStoredSession() {
  return useSyncExternalStore(subscribe, readStoredSession)
}
