import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_autenticado/pagamento')({
  head: () => ({ meta: [{ title: 'Pagamento | Kurio' }] }),
  component: () => (
    <section className="page-container py-12">
      <h1 className="text-2xl font-bold">Pagamento</h1>
    </section>
  ),
})
