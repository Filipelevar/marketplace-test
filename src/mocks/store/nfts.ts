import type { CatalogSearch, NftDetail, NftSummary } from '@/types/nfts/NftTypes'
import { compareEth, formatEth, parseEth } from '@/utils/EthUtils'
import type { NftRecord } from '@/mocks/fixtures/nfts'
import { commit, getDb } from '@/mocks/store/db'
import { notifyNftChanged } from '@/mocks/store/events'

export type NftPatch = {
  priceEth?: string
  editionAvailability?: Record<string, number>
}

export function updateNft(id: string, patch: NftPatch): NftRecord | null {
  const nft = getDb().nfts[id]
  if (!nft) return null
  commit(() => {
    if (patch.priceEth) nft.priceEth = patch.priceEth
    for (const [editionId, available] of Object.entries(patch.editionAvailability ?? {})) {
      const edition = nft.editions.find((candidate) => candidate.id === editionId)
      if (edition) edition.available = Math.max(0, Math.floor(available))
    }
    nft.available = nft.editions.reduce((total, edition) => total + edition.available, 0)
    nft.version += 1
  })
  notifyNftChanged(nft)
  return nft
}

export function toSummary(record: NftRecord): NftSummary {
  return {
    id: record.id,
    name: record.name,
    tokenId: record.tokenId,
    collection: record.collection,
    network: record.network,
    image: record.image,
    priceEth: record.priceEth,
    compareAtPriceEth: record.compareAtPriceEth,
    rarity: record.rarity,
    available: record.available,
    listedAt: record.listedAt,
    version: record.version,
  }
}

export function toDetail(record: NftRecord): NftDetail {
  return {
    ...toSummary(record),
    description: record.description,
    story: record.story,
    collectionName: record.collectionName,
    creator: record.creator,
    contractAddress: record.contractAddress,
    royaltyPercent: record.royaltyPercent,
    attributes: record.attributes,
    rating: record.rating,
    reviews: record.reviews,
    editions: record.editions,
    gallery: record.gallery,
  }
}

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

type FilterKey = 'collections' | 'networks'

export function filterNfts(search: CatalogSearch, ignore?: FilterKey): NftRecord[] {
  const query = search.q ? normalize(search.q) : null
  return Object.values(getDb().nfts).filter((nft) => {
    if (query && ![nft.name, nft.collectionName, nft.creator].some((field) => normalize(field).includes(query))) {
      return false
    }
    if (ignore !== 'collections' && search.collections?.length && !search.collections.includes(nft.collection)) {
      return false
    }
    if (ignore !== 'networks' && search.networks?.length && !search.networks.includes(nft.network)) return false
    if (search.tab === 'novos' && !nft.isNewRelease) return false
    if (search.tab === 'em-alta' && !nft.trending) return false
    if (search.minPrice && compareEth(nft.priceEth, search.minPrice) < 0) return false
    if (search.maxPrice && compareEth(nft.priceEth, search.maxPrice) > 0) return false
    return true
  })
}

const collator = new Intl.Collator('pt-BR')

export function sortNfts(items: NftRecord[], sort: CatalogSearch['sort']): NftRecord[] {
  const sorted = [...items]
  switch (sort) {
    case 'preco-asc':
      return sorted.sort((a, b) => compareEth(a.priceEth, b.priceEth) || collator.compare(a.name, b.name))
    case 'preco-desc':
      return sorted.sort((a, b) => compareEth(b.priceEth, a.priceEth) || collator.compare(a.name, b.name))
    case 'nome':
      return sorted.sort((a, b) => collator.compare(a.name, b.name))
    default:
      return sorted.sort((a, b) => b.listedAt.localeCompare(a.listedAt))
  }
}

export function countBy<K extends string>(items: NftRecord[], key: (nft: NftRecord) => K, keys: readonly K[]) {
  return keys.map((slug) => ({ slug, count: items.filter((nft) => key(nft) === slug).length }))
}

export function priceRange(items: NftRecord[]) {
  if (items.length === 0) return { min: '0.00', max: '0.00' }
  const prices = items.map((nft) => parseEth(nft.priceEth))
  const min = prices.reduce((a, b) => (b < a ? b : a))
  const max = prices.reduce((a, b) => (b > a ? b : a))
  return { min: formatEth(min), max: formatEth(max) }
}
