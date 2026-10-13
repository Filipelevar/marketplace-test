import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main className="grid min-h-dvh place-content-center gap-4">
      <h1 className="text-2xl font-semibold">GreenMint</h1>
      <Link to="/nfts/$nftId" params={{ nftId: 'demo' }} className="underline">
        Ver NFT de exemplo
      </Link>
    </main>
  )
}
