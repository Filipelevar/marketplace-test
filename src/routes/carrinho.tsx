import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/carrinho')({
  head: () => ({ meta: [{ title: 'Carrinho | Kurio' }] }),
  component: () => (
    <section className="page-container py-12">
      <h1 className="text-2xl font-bold">Carrinho de NFTs</h1>
    </section>
  ),
})
