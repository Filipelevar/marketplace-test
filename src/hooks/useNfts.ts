import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { CatalogSearch } from '@/types/nfts/NftTypes'
import { getFeaturedNfts, getNftById, getNfts, getRelatedNfts } from '@/services/nfts/NftServices'
import { nftKeys } from '@/hooks/queryKeys'

export function nftListQuery(search: CatalogSearch) {
  return queryOptions({
    queryKey: nftKeys.list(search),
    queryFn: ({ signal }) => getNfts(search, signal),
    placeholderData: keepPreviousData,
  })
}

export function nftDetailQuery(id: string) {
  return queryOptions({
    queryKey: nftKeys.detail(id),
    queryFn: ({ signal }) => getNftById(id, signal),
  })
}

export function relatedNftsQuery(id: string) {
  return queryOptions({
    queryKey: nftKeys.related(id),
    queryFn: ({ signal }) => getRelatedNfts(id, signal),
    staleTime: 5 * 60_000,
  })
}

export function featuredNftsQuery() {
  return queryOptions({
    queryKey: nftKeys.featured(),
    queryFn: ({ signal }) => getFeaturedNfts(signal),
    staleTime: 5 * 60_000,
  })
}
