import { HttpResponse } from 'msw'
import type { z } from 'zod'
import type { ApiErrorBody, ApiErrorCode } from '@/types/APITypes'

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 422,
  UNAUTHORIZED: 401,
  SESSION_EXPIRED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNAVAILABLE: 503,
  QUOTE_CHANGED: 409,
  IDEMPOTENCY_CONFLICT: 409,
  WALLET_DISCONNECTED: 409,
  WALLET_REJECTED: 403,
  CART_EMPTY: 409,
}

export function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return typeof value === 'string' && value in STATUS_BY_CODE
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  fieldErrors?: Record<string, string>,
  extra: Pick<ApiErrorBody, 'quote'> = {},
) {
  const body: ApiErrorBody = { code, message, ...(fieldErrors ? { fieldErrors } : {}), ...extra }
  return HttpResponse.json(body, { status: STATUS_BY_CODE[code] })
}

export function validationError(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    const field = issue.path.join('.')
    if (field && !(field in fieldErrors)) fieldErrors[field] = issue.message
  }
  return apiError('VALIDATION_ERROR', 'Verifique os campos destacados.', fieldErrors)
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}
