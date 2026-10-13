import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthScreen } from '@/features/auth/components/auth-screen'
import { authSearchSchema, safeRedirect } from '@/features/auth/redirect'
import { readStoredSession } from '@/features/auth/session-storage'

export const Route = createFileRoute('/cadastro')({
  validateSearch: authSearchSchema,
  beforeLoad: ({ search }) => {
    if (readStoredSession()) throw redirect({ href: safeRedirect(search.redirect), replace: true })
  },
  head: () => ({ meta: [{ title: 'Criar conta | Kurio' }] }),
  component: RegisterPage,
})

function RegisterPage() {
  const search = Route.useSearch()
  return <AuthScreen mode="register" search={search} />
}
