import { MAX_QUANTITY_PER_ORDER, type NftEdition } from '@/contracts/nft'

const PREFERRED_EDITION_ID = '1-50'

export function pickEdition(editions: NftEdition[], requestedId: string | undefined): NftEdition | undefined {
  const requested = editions.find((edition) => edition.id === requestedId)
  if (requested) return requested
  const preferred = editions.find((edition) => edition.id === PREFERRED_EDITION_ID && edition.available > 0)
  return preferred ?? editions.find((edition) => edition.available > 0) ?? editions[0]
}

export function maxQuantityFor(edition: NftEdition | undefined): number {
  if (!edition) return 0
  return Math.min(edition.available, MAX_QUANTITY_PER_ORDER)
}

export function editionLabel(edition: NftEdition): string {
  return edition.supply === null ? 'ABERTA' : edition.label
}
