import { createFileRoute } from '@tanstack/react-router'
import { CheckoutPage } from '@/pages/checkout'

export const Route = createFileRoute('/_autenticado/pagamento')({
  head: () => ({ meta: [{ title: 'Pagamento | Kurio' }] }),
  component: CheckoutPage,
})
