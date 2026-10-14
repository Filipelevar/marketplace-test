import { createFileRoute } from '@tanstack/react-router'
import { nftDetailSearchSchema } from '@/types/nfts/NftTypes'
import { nftDetailQuery, relatedNftsQuery } from '@/hooks/useNfts'
import { NftDetailPage } from '@/pages/nft-detail'

export const Route = createFileRoute('/nfts/$nftId')({
  validateSearch: nftDetailSearchSchema,
  staticData: { mobileBottomBar: 'purchase' },
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(nftDetailQuery(params.nftId))
    void context.queryClient.prefetchQuery(relatedNftsQuery(params.nftId))
  },
  component: NftDetailPage,
})
