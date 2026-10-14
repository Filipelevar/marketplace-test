import { useQuery } from '@tanstack/react-query'
import { relatedNftsQuery } from '@/hooks/useNfts'
import { NftCarousel } from '@/components/nft-carousel'

export function RelatedNfts({ nftId }: { nftId: string }) {
  const { data, isPending, isError } = useQuery(relatedNftsQuery(nftId))
  if (isError) return null
  return <NftCarousel title="Mais desta coleção" items={data} isPending={isPending} />
}
