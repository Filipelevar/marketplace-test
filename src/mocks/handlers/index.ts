import { http } from 'msw'
import { apiError } from '@/mocks/http'
import { socketHandlers } from '@/mocks/socket/server'
import { devHandlers } from './dev'
import { newsletterHandlers } from './newsletter'

export const handlers = [
  ...socketHandlers,
  ...devHandlers,
  ...newsletterHandlers,

  http.all('/api/*', ({ request }) =>
    apiError('NOT_FOUND', `No route for ${request.method} ${new URL(request.url).pathname}`),
  ),
]
