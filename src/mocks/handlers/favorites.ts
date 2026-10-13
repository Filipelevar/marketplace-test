import { http, HttpResponse } from 'msw'
import type { FavoritesResponse } from '@/contracts/cart'
import { authenticate } from '@/mocks/auth'
import { apiError } from '@/mocks/http'
import { commit, getDb } from '@/mocks/store/db'
import { toSummary } from '@/mocks/store/nfts'

export const favoriteHandlers = [
  http.get('/api/favorites', ({ request }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    const { favorites, nfts } = getDb()
    const ids = favorites[auth.user.id] ?? []
    const body: FavoritesResponse = { items: ids.flatMap((id) => (nfts[id] ? [toSummary(nfts[id])] : [])) }
    return HttpResponse.json(body)
  }),

  http.put('/api/favorites/:nftId', ({ request, params }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    const nftId = String(params.nftId)
    if (!getDb().nfts[nftId]) return apiError('NOT_FOUND', 'NFT não encontrado.')
    commit((state) => {
      const current = state.favorites[auth.user.id] ?? []
      if (!current.includes(nftId)) state.favorites[auth.user.id] = [nftId, ...current]
    })
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete('/api/favorites/:nftId', ({ request, params }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    commit((state) => {
      state.favorites[auth.user.id] = (state.favorites[auth.user.id] ?? []).filter((id) => id !== params.nftId)
    })
    return new HttpResponse(null, { status: 204 })
  }),
]
