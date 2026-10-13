import { http } from 'msw'
import { apiError } from '@/mocks/http'
import { socketHandlers } from '@/mocks/socket/server'
import { devHandlers } from './dev'
import { networkHandlers } from './network'
import { newsletterHandlers } from './newsletter'
import { nftHandlers } from './nfts'

export const handlers = [
  ...socketHandlers,
  ...devHandlers,
  ...networkHandlers,
  ...newsletterHandlers,
  ...nftHandlers,

  http.all('/api/*', ({ request }) =>
    apiError('NOT_FOUND', `No route for ${request.method} ${new URL(request.url).pathname}`),
  ),
]
