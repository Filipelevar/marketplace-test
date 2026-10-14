import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import type { User } from '@/types/auth/AuthTypes'
import { profileUpdateSchema, type ProfileUpdateInput } from '@/types/profile/ProfileTypes'
import { FormField } from '@/components/inputs/form-field'
import { Button } from '@/components/ui/button'
import { getApiError, getApiErrorMessage } from '@/utils/ApiErrorUtils'
import { useUpdateProfile } from '@/hooks/useProfile'
import { AvatarField } from '@/pages/account/profile/avatar-field'

const FIELDS = ['displayName', 'username', 'email', 'ensName', 'walletNickname'] as const

function isProfileField(value: string): value is (typeof FIELDS)[number] {
  return (FIELDS as readonly string[]).includes(value)
}

export function ProfileForm({ user }: { user: User }) {
  const update = useUpdateProfile()
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      ensName: user.ensName ?? '',
      walletNickname: user.walletNickname ?? '',
    },
  })

  const onSubmit = handleSubmit((values) =>
    update.mutate(values, {
      onSuccess: (saved) => {
        reset({
          displayName: saved.displayName,
          username: saved.username,
          email: saved.email,
          ensName: saved.ensName ?? '',
          walletNickname: saved.walletNickname ?? '',
        })
        toast.success('Dados do perfil salvos.')
      },
      onError: (error) => {
        const fieldErrors = getApiError(error)?.fieldErrors ?? {}
        for (const [field, message] of Object.entries(fieldErrors)) {
          if (isProfileField(field)) setError(field, { message }, { shouldFocus: true })
        }
        if (Object.keys(fieldErrors).length === 0) toast.error('Não foi possível salvar o perfil.', { description: getApiErrorMessage(error) })
      },
    }),
  )

  return (
    <section aria-labelledby="perfil-titulo" className="flex flex-col gap-6">
      <h1 id="perfil-titulo" className="text-lg font-bold">
        Perfil do colecionador
      </h1>
      <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-2 lg:gap-x-7">
        <FormField label="Nome de exibição" required error={errors.displayName?.message} autoComplete="name" {...register('displayName')} />
        <FormField label="Nome de usuário" required error={errors.username?.message} autoComplete="username" {...register('username')} />
        <FormField label="E-mail" type="email" required error={errors.email?.message} autoComplete="email" {...register('email')} />
        <div className="relative">
          <FormField label="Nome ENS (opcional)" error={errors.ensName?.message} className="pr-14" {...register('ensName')} />
          <span aria-hidden className="pointer-events-none absolute top-[2.6rem] right-4 text-sm text-muted-foreground">
            .eth
          </span>
        </div>
        <FormField label="Apelido da carteira (opcional)" error={errors.walletNickname?.message} {...register('walletNickname')} />
        <AvatarField user={user} />
        <div className="lg:col-span-2">
          <Button type="submit" size="lg" disabled={update.isPending || !isDirty}>
            {update.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </section>
  )
}
