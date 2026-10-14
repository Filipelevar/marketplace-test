import { useLocation, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useSession } from '@/hooks/useAuth'

export function useRequireAuth() {
  const session = useSession()
  const navigate = useNavigate()
  const location = useLocation()

  return function requireAuth(message: string, action: () => void) {
    if (session.status === 'authenticated') {
      action()
      return
    }
    toast.info(message)
    void navigate({ to: '/entrar', search: { redirect: location.href } })
  }
}
