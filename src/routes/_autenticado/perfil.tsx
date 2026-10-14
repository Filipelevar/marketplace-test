import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/pages/account/profile'

export const Route = createFileRoute('/_autenticado/perfil')({
  head: () => ({ meta: [{ title: 'Meu perfil | Kurio' }] }),
  component: ProfilePage,
})
