import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <section className="page-container flex flex-col gap-4 py-24">
      <h1 className="text-2xl font-bold">Kurio</h1>
      <div id="catalogo">
        <Link to="/nfts/$nftId" params={{ nftId: 'demo' }} className="text-highlight underline">
          Ver NFT de exemplo
        </Link>
      </div>
    </section>
  )
}
