import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { readStoredSession } from '@/features/auth/session-storage'

export const Route = createFileRoute('/_autenticado')({
  beforeLoad: ({ location }) => {
    if (!readStoredSession()) {
      throw redirect({ to: '/entrar', search: { redirect: location.href }, replace: true })
    }
  },
  component: Outlet,
})
