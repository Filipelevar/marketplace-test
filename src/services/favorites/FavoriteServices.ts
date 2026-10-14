import type { GenericAbortSignal } from 'axios'
import type { FavoritesResponse } from '@/types/cart/CartTypes'
import { API } from '@/services/api'

export async function getFavorites(signal?: GenericAbortSignal) {
  const { data } = await API.get<FavoritesResponse>('/favorites', { signal })
  return data
}

export async function addFavorite(nftId: string) {
  await API.put(`/favorites/${encodeURIComponent(nftId)}`)
}

export async function removeFavorite(nftId: string) {
  await API.delete(`/favorites/${encodeURIComponent(nftId)}`)
}
