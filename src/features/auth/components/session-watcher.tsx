import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { onSessionEvent } from '@/app/session-events'
import { signOutLocally } from '../api'
import { readStoredSession } from '../session-storage'

export function SessionWatcher() {
  const queryClient = useQueryClient()
  const router = useRouter()

  useEffect(
    () =>
      onSessionEvent((event) => {
        if (event.type !== 'expired' || !readStoredSession()) return
        signOutLocally(queryClient)
        toast.warning('Sua sessão expirou. Entre novamente para continuar.')
        const current = router.state.location.href
        void router.navigate({ to: '/entrar', search: { redirect: current, motivo: 'expirada' }, replace: true })
      }),
    [queryClient, router],
  )

  return null
}
