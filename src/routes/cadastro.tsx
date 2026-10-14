import { createFileRoute, redirect } from '@tanstack/react-router'
import { RegisterPage } from '@/pages/auth'
import { authSearchSchema, safeRedirect } from '@/utils/RedirectUtils'
import { readStoredSession } from '@/stores/session-store'

export const Route = createFileRoute('/cadastro')({
  validateSearch: authSearchSchema,
  beforeLoad: ({ search }) => {
    if (readStoredSession()) throw redirect({ href: safeRedirect(search.redirect), replace: true })
  },
  head: () => ({ meta: [{ title: 'Criar conta | Kurio' }] }),
  component: RegisterPage,
})
