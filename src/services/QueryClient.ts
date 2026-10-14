import { QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

const MAX_QUERY_RETRIES = 2

function isClientError(error: unknown) {
  if (!isAxiosError(error) || !error.response) return false
  return error.response.status >= 400 && error.response.status < 500
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => !isClientError(error) && failureCount < MAX_QUERY_RETRIES,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
