import { isAxiosError } from 'axios'
import { getApiError } from '@/lib/api-error'
import { http } from '@/lib/http'
import { readStoredSession } from '@/features/auth/session-storage'
import { readGuestCartId } from '@/features/cart/cart-id-storage'
import { emitSessionEvent } from './session-events'

export function installHttpInterceptors() {
  http.interceptors.request.use((config) => {
    const session = readStoredSession()
    if (session) config.headers.set('Authorization', `Bearer ${session.token}`)
    const cartId = readGuestCartId()
    if (cartId) config.headers.set('X-Cart-Id', cartId)
    return config
  })

  http.interceptors.response.use(undefined, (error: unknown) => {
    if (isAxiosError(error) && error.config?.headers.get('Authorization')) {
      const code = getApiError(error)?.code
      if (code === 'SESSION_EXPIRED' || code === 'UNAUTHORIZED') emitSessionEvent({ type: 'expired' })
    }
    return Promise.reject(error)
  })
}
