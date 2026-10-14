import { createFileRoute } from '@tanstack/react-router'
import { OrderPage } from '@/pages/order'

export const Route = createFileRoute('/_autenticado/pedidos/$orderId')({
  head: () => ({ meta: [{ title: 'Pedido | Kurio' }] }),
  component: OrderPage,
})
