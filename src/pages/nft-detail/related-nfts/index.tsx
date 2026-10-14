import { useQuery } from '@tanstack/react-query'
import { relatedNftsQuery } from '@/features/catalog/api'
import { NftCarousel } from '@/features/catalog/components/nft-carousel'

export function RelatedNfts({ nftId }: { nftId: string }) {
  const { data, isPending, isError } = useQuery(relatedNftsQuery(nftId))
  if (isError) return null
  return <NftCarousel title="Mais desta coleção" items={data} isPending={isPending} />
}
