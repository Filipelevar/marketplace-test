import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/nfts/$nftId')({
  component: NftDetailPage,
})

function NftDetailPage() {
  const { nftId } = Route.useParams()

  return (
    <main className="grid min-h-dvh place-content-center gap-4">
      <h1 className="text-2xl font-semibold">NFT {nftId}</h1>
      <Link to="/" className="underline">
        Voltar
      </Link>
    </main>
  )
}
