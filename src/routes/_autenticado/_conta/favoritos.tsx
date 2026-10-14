import { createFileRoute } from '@tanstack/react-router'
import { FavoritesPage } from '@/pages/account/favorites'

export const Route = createFileRoute('/_autenticado/_conta/favoritos')({
  head: () => ({ meta: [{ title: 'Lista de interesse | Kurio' }] }),
  component: FavoritesPage,
})
