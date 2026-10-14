import type { GenericAbortSignal } from 'axios'
import type { CatalogSearch, FeaturedNftsResponse, NftDetail, NftListResponse, NftSummary } from '@/types/nfts/NftTypes'
import { API } from '@/services/api'

function toQueryParams(search: CatalogSearch) {
  return {
    q: search.q,
    collections: search.collections?.join(','),
    networks: search.networks?.join(','),
    tab: search.tab,
    sort: search.sort,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    page: search.page,
  }
}

export async function getNfts(search: CatalogSearch, signal?: GenericAbortSignal) {
  const { data } = await API.get<NftListResponse>('/nfts', { params: toQueryParams(search), signal })
  return data
}

export async function getNftById(id: string, signal?: GenericAbortSignal) {
  const { data } = await API.get<NftDetail>(`/nfts/${encodeURIComponent(id)}`, { signal })
  return data
}

export async function getRelatedNfts(id: string, signal?: GenericAbortSignal) {
  const { data } = await API.get<NftSummary[]>(`/nfts/${encodeURIComponent(id)}/related`, { signal })
  return data
}

export async function getFeaturedNfts(signal?: GenericAbortSignal) {
  const { data } = await API.get<FeaturedNftsResponse>('/nfts/featured', { signal })
  return data
}
