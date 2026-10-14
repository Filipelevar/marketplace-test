import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { readStoredSession } from '@/stores/session-store'

export const Route = createFileRoute('/_autenticado')({
  beforeLoad: ({ location }) => {
    if (!readStoredSession()) {
      throw redirect({ to: '/entrar', search: { redirect: location.href }, replace: true })
    }
  },
  component: Outlet,
})
