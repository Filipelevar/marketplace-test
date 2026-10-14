import { z } from 'zod'
import type { EthString } from '@/lib/eth'

export const COLLECTIONS = [
  { slug: 'arte-digital', label: 'Arte digital' },
  { slug: 'fotografia', label: 'Fotografia' },
  { slug: 'musica', label: 'Música' },
  { slug: 'arte-3d', label: 'Arte 3D' },
  { slug: 'colecionaveis', label: 'Colecionáveis' },
  { slug: 'generativa', label: 'Generativa' },
  { slug: 'jogos', label: 'Jogos' },
  { slug: 'assinaturas', label: 'Assinaturas' },
  { slug: 'utilidade', label: 'Utilidade' },
] as const

export const NETWORKS = [
  { slug: 'ethereum', label: 'Ethereum' },
  { slug: 'polygon', label: 'Polygon' },
  { slug: 'solana', label: 'Solana' },
] as const

export const CATALOG_TABS = [
  { slug: 'todos', label: 'Todos os NFTs' },
  { slug: 'novos', label: 'Novos lançamentos' },
  { slug: 'em-alta', label: 'Em alta' },
] as const

export const CATALOG_SORTS = [
  { slug: 'recentes', label: 'Listados recentemente' },
  { slug: 'preco-asc', label: 'Menor preço' },
  { slug: 'preco-desc', label: 'Maior preço' },
  { slug: 'nome', label: 'Nome (A-Z)' },
] as const

export type CollectionSlug = (typeof COLLECTIONS)[number]['slug']
export type NetworkSlug = (typeof NETWORKS)[number]['slug']
export type CatalogTab = (typeof CATALOG_TABS)[number]['slug']
export type CatalogSort = (typeof CATALOG_SORTS)[number]['slug']

const collectionSlugs = COLLECTIONS.map((item) => item.slug) as [CollectionSlug, ...CollectionSlug[]]
const networkSlugs = NETWORKS.map((item) => item.slug) as [NetworkSlug, ...NetworkSlug[]]
const tabSlugs = CATALOG_TABS.map((item) => item.slug) as [CatalogTab, ...CatalogTab[]]
const sortSlugs = CATALOG_SORTS.map((item) => item.slug) as [CatalogSort, ...CatalogSort[]]

export const CATALOG_PAGE_SIZE = 9

function csvOf<T extends string>(allowed: readonly T[]) {
  return z
    .union([z.string(), z.array(z.string())])
    .transform((value) => {
      const parts = Array.isArray(value) ? value : value.split(',')
      const unique = new Set(parts.map((part) => part.trim()).filter((part): part is T => allowed.includes(part as T)))
      return allowed.filter((item) => unique.has(item))
    })
}

const ethAmount = z
  .union([z.string(), z.number()])
  .transform((value) => String(value))
  .refine((value) => /^\d+(\.\d{1,18})?$/.test(value))

export const catalogSearchSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  collections: csvOf(collectionSlugs).optional().catch(undefined),
  networks: csvOf(networkSlugs).optional().catch(undefined),
  tab: z.enum(tabSlugs).optional().catch(undefined),
  sort: z.enum(sortSlugs).optional().catch(undefined),
  minPrice: ethAmount.optional().catch(undefined),
  maxPrice: ethAmount.optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
})

export type CatalogSearch = z.infer<typeof catalogSearchSchema>

export type NftImage = {
  thumb: string
  full: string
  alt: string
}

export const MAX_QUANTITY_PER_ORDER = 10

export type NftEdition = {
  id: string
  label: string
  supply: number | null
  available: number
}

export type NftSummary = {
  id: string
  name: string
  tokenId: string
  collection: CollectionSlug
  network: NetworkSlug
  image: NftImage
  priceEth: EthString
  compareAtPriceEth: EthString | null
  rarity: 'raro' | null
  available: number
  listedAt: string
  version: number
}

export type NftReview = {
  id: string
  author: string
  rating: number
  comment: string
  createdAt: string
}

export type NftDetail = NftSummary & {
  description: string
  story: string[]
  collectionName: string
  creator: string
  contractAddress: string
  royaltyPercent: number
  attributes: string[]
  rating: { average: number; count: number }
  reviews: NftReview[]
  editions: NftEdition[]
  gallery: NftImage[]
}

export const nftDetailSearchSchema = z.object({
  edition: z.string().max(20).optional().catch(undefined),
})

export type NftDetailSearch = z.infer<typeof nftDetailSearchSchema>

export type FacetCount<T extends string> = { slug: T; count: number }

export type NftListResponse = {
  items: NftSummary[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  facets: {
    collections: FacetCount<CollectionSlug>[]
    networks: FacetCount<NetworkSlug>[]
    priceRange: { min: EthString; max: EthString }
  }
}

export type FeaturedNftsResponse = {
  hero: NftSummary[]
  spotlight: NftSummary
}
