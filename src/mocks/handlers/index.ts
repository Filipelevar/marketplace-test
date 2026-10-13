import { http } from 'msw'
import { apiError } from '@/mocks/http'
import { socketHandlers } from '@/mocks/socket/server'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { checkoutHandlers } from './checkout'
import { devHandlers } from './dev'
import { favoriteHandlers } from './favorites'
import { networkHandlers } from './network'
import { newsletterHandlers } from './newsletter'
import { nftHandlers } from './nfts'
import { walletHandlers } from './wallets'

export const handlers = [
  ...socketHandlers,
  ...devHandlers,
  ...networkHandlers,
  ...newsletterHandlers,
  ...authHandlers,
  ...nftHandlers,
  ...favoriteHandlers,
  ...cartHandlers,
  ...walletHandlers,
  ...checkoutHandlers,

  http.all('/api/*', ({ request }) =>
    apiError('NOT_FOUND', `No route for ${request.method} ${new URL(request.url).pathname}`),
  ),
]
