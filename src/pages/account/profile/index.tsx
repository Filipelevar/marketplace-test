import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from '@/hooks/useAuth'
import { PasswordForm } from '@/pages/account/profile/password-form'
import { ProfileForm } from '@/pages/account/profile/profile-form'

export function ProfilePage() {
  const session = useSession()

  if (session.status !== 'authenticated') {
    return (
      <div aria-busy className="flex flex-col gap-6">
        <span role="status" className="sr-only">
          Carregando perfil
        </span>
        <Skeleton className="h-6 w-56" />
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-12">
      <ProfileForm key={session.user.id} user={session.user} />
      <PasswordForm />
    </div>
  )
}
