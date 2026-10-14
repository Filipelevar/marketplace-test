import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/pages/account/profile'

export const Route = createFileRoute('/_autenticado/_conta/perfil')({
  head: () => ({ meta: [{ title: 'Meu perfil | Kurio' }] }),
  component: ProfilePage,
})
