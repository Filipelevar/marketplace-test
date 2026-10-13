import { createRootRouteWithContext, HeadContent, Link, Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import type { RouterContext } from '@/app/router'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { Button } from '@/components/ui/button'
import { SessionWatcher } from '@/features/auth/components/session-watcher'
import { RealtimeSync } from '@/features/realtime/realtime-sync'

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
  notFoundComponent: NotFound,
})

function RootLayout() {
  return (
    <>
      <HeadContent />
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:font-bold focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader />
      <main id="conteudo" tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      <SiteFooter />
      <MobileTabBar />
      <SessionWatcher />
      <RealtimeSync />
      <Toaster theme="dark" position="top-center" closeButton mobileOffset={{ top: 76 }} />
    </>
  )
}

function NotFound() {
  return (
    <section className="page-container flex flex-col items-center gap-6 py-24 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="max-w-md text-sm leading-6 text-muted-foreground">
        O endereço que você acessou não existe ou foi movido.
      </p>
      <Button asChild size="lg">
        <Link to="/">Voltar ao início</Link>
      </Button>
    </section>
  )
}
