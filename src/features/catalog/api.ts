import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { CatalogSearch, FeaturedNftsResponse, NftDetail, NftListResponse } from '@/contracts/nft'
import { http } from '@/lib/http'

export const nftKeys = {
  all: ['nfts'] as const,
  lists: () => [...nftKeys.all, 'list'] as const,
  list: (search: CatalogSearch) => [...nftKeys.lists(), search] as const,
  details: () => [...nftKeys.all, 'detail'] as const,
  detail: (id: string) => [...nftKeys.details(), id] as const,
  featured: () => [...nftKeys.all, 'featured'] as const,
}

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

export function nftListQuery(search: CatalogSearch) {
  return queryOptions({
    queryKey: nftKeys.list(search),
    queryFn: async ({ signal }) => {
      const { data } = await http.get<NftListResponse>('/nfts', { params: toQueryParams(search), signal })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function nftDetailQuery(id: string) {
  return queryOptions({
    queryKey: nftKeys.detail(id),
    queryFn: async ({ signal }) => {
      const { data } = await http.get<NftDetail>(`/nfts/${encodeURIComponent(id)}`, { signal })
      return data
    },
  })
}

export function featuredNftsQuery() {
  return queryOptions({
    queryKey: nftKeys.featured(),
    queryFn: async ({ signal }) => {
      const { data } = await http.get<FeaturedNftsResponse>('/nfts/featured', { signal })
      return data
    },
    staleTime: 5 * 60_000,
  })
}
