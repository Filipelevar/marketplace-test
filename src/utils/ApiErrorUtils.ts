import { isAxiosError } from 'axios'
import type { ApiErrorBody } from '@/contracts/api-error'

const NETWORK_ERROR_MESSAGE = 'Não foi possível conectar. Verifique sua conexão e tente novamente.'
const UNKNOWN_ERROR_MESSAGE = 'Algo deu errado. Tente novamente.'

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null && 'code' in value && 'message' in value
}

export function getApiError(error: unknown): ApiErrorBody | null {
  if (isAxiosError(error) && isApiErrorBody(error.response?.data)) return error.response.data
  return null
}

export function getApiErrorMessage(error: unknown): string {
  const apiError = getApiError(error)
  if (apiError) return apiError.message
  if (isAxiosError(error) && !error.response) return NETWORK_ERROR_MESSAGE
  return UNKNOWN_ERROR_MESSAGE
}
