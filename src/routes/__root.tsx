import { createRootRouteWithContext } from '@tanstack/react-router'
import type { RouterContext } from '@/services/Router'
import { RootLayout } from '@/pages/core/layout'
import { NotFoundPage } from '@/pages/core/not-found'

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { title: 'Kurio | Marketplace de NFTs' },
      {
        name: 'description',
        content: 'Descubra, colecione e compre NFTs selecionados de criadores emergentes e consagrados na Kurio.',
      },
    ],
  }),
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})
