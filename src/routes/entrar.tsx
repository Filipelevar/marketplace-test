import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthScreen } from '@/features/auth/components/auth-screen'
import { authSearchSchema, safeRedirect } from '@/features/auth/redirect'
import { readStoredSession } from '@/features/auth/session-storage'

export const Route = createFileRoute('/entrar')({
  validateSearch: authSearchSchema,
  beforeLoad: ({ search }) => {
    if (readStoredSession()) throw redirect({ href: safeRedirect(search.redirect), replace: true })
  },
  head: () => ({ meta: [{ title: 'Entrar | Kurio' }] }),
  component: LoginPage,
})

function LoginPage() {
  const search = Route.useSearch()
  return <AuthScreen mode="login" search={search} />
}
