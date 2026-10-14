import { createFileRoute } from '@tanstack/react-router'
import { CartPage } from '@/pages/cart'

export const Route = createFileRoute('/carrinho')({
  head: () => ({ meta: [{ title: 'Carrinho | Kurio' }] }),
  component: CartPage,
})
