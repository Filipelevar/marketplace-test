import { createFileRoute } from '@tanstack/react-router'
import { WalletsPage } from '@/pages/account/wallets'

export const Route = createFileRoute('/_autenticado/_conta/carteiras')({
  head: () => ({ meta: [{ title: 'Carteiras | Kurio' }] }),
  component: WalletsPage,
})
