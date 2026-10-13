import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/entrar')({
  head: () => ({ meta: [{ title: 'Entrar | Kurio' }] }),
  component: () => (
    <section className="page-container py-12">
      <h1 className="text-2xl font-bold">Entrar</h1>
    </section>
  ),
})
