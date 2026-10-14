import { createFileRoute } from '@tanstack/react-router'
import { AccountLayout } from '@/pages/account'

export const Route = createFileRoute('/_autenticado/_conta')({
  component: AccountLayout,
})
