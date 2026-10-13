import { http, HttpResponse } from 'msw'
import {
  CATALOG_PAGE_SIZE,
  catalogSearchSchema,
  COLLECTIONS,
  NETWORKS,
  type FeaturedNftsResponse,
  type NftListResponse,
} from '@/contracts/nft'
import { HERO_NFT_IDS, SPOTLIGHT_NFT_ID } from '@/mocks/fixtures/nfts'
import { apiError } from '@/mocks/http'
import { getDb } from '@/mocks/store/db'
import { countBy, filterNfts, priceRange, sortNfts, toDetail, toSummary } from '@/mocks/store/nfts'

export const nftHandlers = [
  http.get('/api/nfts/featured', () => {
    const { nfts } = getDb()
    const hero = HERO_NFT_IDS.flatMap((id) => (nfts[id] ? [toSummary(nfts[id])] : []))
    const spotlight = nfts[SPOTLIGHT_NFT_ID]
    if (!spotlight || hero.length === 0) return apiError('NOT_FOUND', 'Nenhum destaque disponível.')
    const body: FeaturedNftsResponse = { hero, spotlight: toSummary(spotlight) }
    return HttpResponse.json(body)
  }),

  http.get('/api/nfts', ({ request }) => {
    const params = Object.fromEntries(new URL(request.url).searchParams)
    const search = catalogSearchSchema.parse(params)
    const matches = sortNfts(filterNfts(search), search.sort)
    const total = matches.length
    const totalPages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE))
    const page = search.page ?? 1
    const start = (page - 1) * CATALOG_PAGE_SIZE

    const body: NftListResponse = {
      items: matches.slice(start, start + CATALOG_PAGE_SIZE).map(toSummary),
      page,
      pageSize: CATALOG_PAGE_SIZE,
      total,
      totalPages,
      facets: {
        collections: countBy(
          filterNfts(search, 'collections'),
          (nft) => nft.collection,
          COLLECTIONS.map((item) => item.slug),
        ),
        networks: countBy(
          filterNfts(search, 'networks'),
          (nft) => nft.network,
          NETWORKS.map((item) => item.slug),
        ),
        priceRange: priceRange(Object.values(getDb().nfts)),
      },
    }
    return HttpResponse.json(body)
  }),

  http.get('/api/nfts/:id', ({ params }) => {
    const nft = getDb().nfts[String(params.id)]
    if (!nft) return apiError('NOT_FOUND', 'NFT não encontrado.')
    return HttpResponse.json(toDetail(nft))
  }),
]
