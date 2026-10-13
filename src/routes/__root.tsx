import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import type { RouterContext } from '@/app/router'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  return (
    <div className="min-h-dvh">
      <Outlet />
    </div>
  )
}

function NotFound() {
  return (
    <main className="grid min-h-dvh place-content-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <Link to="/" className="underline">
        Voltar ao início
      </Link>
    </main>
  )
}
