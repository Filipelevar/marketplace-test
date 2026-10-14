import { http } from 'msw'
import { apiError } from '@/mocks/http'
import { socketHandlers } from '@/mocks/socket/server'
import { authHandlers } from '@/mocks/handlers/auth'
import { cartHandlers } from '@/mocks/handlers/cart'
import { checkoutHandlers } from '@/mocks/handlers/checkout'
import { devHandlers } from '@/mocks/handlers/dev'
import { favoriteHandlers } from '@/mocks/handlers/favorites'
import { networkHandlers } from '@/mocks/handlers/network'
import { newsletterHandlers } from '@/mocks/handlers/newsletter'
import { nftHandlers } from '@/mocks/handlers/nfts'
import { profileHandlers } from '@/mocks/handlers/profile'
import { walletHandlers } from '@/mocks/handlers/wallets'

export const handlers = [
  ...socketHandlers,
  ...devHandlers,
  ...networkHandlers,
  ...newsletterHandlers,
  ...authHandlers,
  ...profileHandlers,
  ...nftHandlers,
  ...favoriteHandlers,
  ...cartHandlers,
  ...walletHandlers,
  ...checkoutHandlers,

  http.all('/api/*', ({ request }) =>
    apiError('NOT_FOUND', `No route for ${request.method} ${new URL(request.url).pathname}`),
  ),
]
