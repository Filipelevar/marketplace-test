import type { CheckoutQuote } from '@/types/checkout/CheckoutTypes'

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'SESSION_EXPIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNAVAILABLE'
  | 'QUOTE_CHANGED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'WALLET_DISCONNECTED'
  | 'WALLET_REJECTED'
  | 'CART_EMPTY'

export type ApiErrorBody = {
  code: ApiErrorCode
  message: string
  fieldErrors?: Record<string, string>
  quote?: CheckoutQuote
}
