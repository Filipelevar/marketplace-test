import { isAxiosError } from 'axios'
import { getApiError } from '@/utils/ApiErrorUtils'
import { API } from '@/services/api'
import { readStoredSession } from '@/stores/session-store'
import { readGuestCartId } from '@/stores/guest-cart-store'
import { emitSessionEvent } from '@/services/interceptors/session-events'

export function installHttpInterceptors() {
  API.interceptors.request.use((config) => {
    const session = readStoredSession()
    if (session) config.headers.set('Authorization', `Bearer ${session.token}`)
    const cartId = readGuestCartId()
    if (cartId) config.headers.set('X-Cart-Id', cartId)
    return config
  })

  API.interceptors.response.use(undefined, (error: unknown) => {
    if (isAxiosError(error) && error.config?.headers.get('Authorization')) {
      const code = getApiError(error)?.code
      if (code === 'SESSION_EXPIRED' || code === 'UNAUTHORIZED') emitSessionEvent({ type: 'expired' })
    }
    return Promise.reject(error)
  })
}
