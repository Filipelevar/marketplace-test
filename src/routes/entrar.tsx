import { createFileRoute, redirect } from '@tanstack/react-router'
import { LoginPage } from '@/pages/auth'
import { authSearchSchema, safeRedirect } from '@/utils/RedirectUtils'
import { readStoredSession } from '@/stores/session-store'

export const Route = createFileRoute('/entrar')({
  validateSearch: authSearchSchema,
  beforeLoad: ({ search }) => {
    if (readStoredSession()) throw redirect({ href: safeRedirect(search.redirect), replace: true })
  },
  head: () => ({ meta: [{ title: 'Entrar | Kurio' }] }),
  component: LoginPage,
})
