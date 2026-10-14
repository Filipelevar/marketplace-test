import { HeadContent, Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { MobileTabBar } from '@/components/tab-bar'
import { SiteFooter } from '@/components/footer'
import { SiteHeader } from '@/components/navbar'
import { SessionWatcher } from '@/components/session-watcher'
import { RealtimeSync } from '@/components/realtime-sync'

export function RootLayout() {
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
