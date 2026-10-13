import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/favoritos')({
  head: () => ({ meta: [{ title: 'Lista de interesse | Kurio' }] }),
  component: () => (
    <section className="page-container py-12">
      <h1 className="text-2xl font-bold">Lista de interesse</h1>
    </section>
  ),
})
