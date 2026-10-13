import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/perfil')({
  head: () => ({ meta: [{ title: 'Meu perfil | Kurio' }] }),
  component: () => (
    <section className="page-container py-12">
      <h1 className="text-2xl font-bold">Perfil do colecionador</h1>
    </section>
  ),
})
