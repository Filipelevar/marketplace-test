import { COLLECTIONS, NETWORKS, type CollectionSlug, type NetworkSlug } from '@/contracts/nft'
import { parseEth, type EthString } from '@/lib/eth'

const WEI_PER_HUNDREDTH = 10n ** 16n

export function collectionLabel(slug: CollectionSlug) {
  return COLLECTIONS.find((item) => item.slug === slug)?.label ?? slug
}

export function networkLabel(slug: NetworkSlug) {
  return NETWORKS.find((item) => item.slug === slug)?.label ?? slug
}

export function ethToHundredths(value: EthString): number {
  return Number(parseEth(value) / WEI_PER_HUNDREDTH)
}

export function hundredthsToEth(value: number): EthString {
  const whole = Math.floor(value / 100)
  const cents = String(value % 100).padStart(2, '0')
  return `${whole}.${cents}`
}

export function localizedEth(value: EthString): string {
  return value.replace('.', ',')
}
