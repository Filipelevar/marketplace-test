import { useNavigate } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLogout, useSession } from '@/hooks/useAuth'

export function ProfilePage() {
  const session = useSession()
  const logout = useLogout()
  const navigate = useNavigate()

  function signOut() {
    logout.mutate(undefined, { onSettled: () => void navigate({ to: '/' }) })
  }

  return (
    <section className="page-container flex flex-col gap-6 py-12">
      <h1 className="text-2xl font-bold">Perfil do colecionador</h1>
      {session.user && (
        <p className="text-muted-foreground">
          Conectado como <strong className="text-foreground">{session.user.displayName}</strong> ({session.user.email})
        </p>
      )}
      <Button variant="outline" onClick={signOut} disabled={logout.isPending} className="w-fit">
        <LogOut aria-hidden />
        Sair
      </Button>
    </section>
  )
}
