import type { CollectorInput } from '@/types/checkout/CheckoutTypes'
import type { WalletConnection } from '@/types/wallets/WalletTypes'

const ATTEMPT_KEY = 'kurio:checkout-attempt'
const CONNECTION_KEY = 'kurio:wallet-connection'

export type CheckoutAttempt = {
  idempotencyKey: string
  quoteId: string
  connectionId: string
  collector: CollectorInput
  status: 'ready' | 'submitted'
  orderId: string | null
}

function read<T>(key: string, guard: (value: unknown) => value is T): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    const value: unknown = raw ? JSON.parse(raw) : null
    return guard(value) ? value : null
  } catch {
    return null
  }
}

function isAttempt(value: unknown): value is CheckoutAttempt {
  return typeof value === 'object' && value !== null && 'idempotencyKey' in value && 'quoteId' in value && 'collector' in value
}

function isConnection(value: unknown): value is WalletConnection {
  return typeof value === 'object' && value !== null && 'id' in value && 'walletId' in value && 'provider' in value
}

export function readAttempt() {
  return read(ATTEMPT_KEY, isAttempt)
}

export function writeAttempt(attempt: CheckoutAttempt) {
  sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(attempt))
}

export function clearAttempt() {
  sessionStorage.removeItem(ATTEMPT_KEY)
}

export function readConnection() {
  return read(CONNECTION_KEY, isConnection)
}

export function writeConnection(connection: WalletConnection | null) {
  if (connection) sessionStorage.setItem(CONNECTION_KEY, JSON.stringify(connection))
  else sessionStorage.removeItem(CONNECTION_KEY)
}

export function clearCheckoutStorage() {
  clearAttempt()
  writeConnection(null)
}

export function newIdempotencyKey() {
  return crypto.randomUUID()
}
