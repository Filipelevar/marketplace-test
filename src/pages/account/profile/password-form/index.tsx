import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { passwordChangeSchema, type PasswordChangeInput } from '@/types/profile/ProfileTypes'
import { PasswordField } from '@/components/inputs/form-field'
import { Button } from '@/components/ui/button'
import { getApiError, getApiErrorMessage } from '@/utils/ApiErrorUtils'
import { useChangePassword } from '@/hooks/useProfile'

const FIELDS = ['currentPassword', 'newPassword', 'confirmPassword'] as const

function isPasswordField(value: string): value is (typeof FIELDS)[number] {
  return (FIELDS as readonly string[]).includes(value)
}

export function PasswordForm() {
  const change = useChangePassword()
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<PasswordChangeInput>({ resolver: zodResolver(passwordChangeSchema) })

  const onSubmit = handleSubmit((values) =>
    change.mutate(values, {
      onSuccess: () => {
        reset({ currentPassword: '', newPassword: '', confirmPassword: '' })
        toast.success('Senha alterada com sucesso.')
      },
      onError: (error) => {
        const fieldErrors = getApiError(error)?.fieldErrors ?? {}
        for (const [field, message] of Object.entries(fieldErrors)) {
          if (isPasswordField(field)) setError(field, { message }, { shouldFocus: true })
        }
        if (Object.keys(fieldErrors).length === 0) toast.error('Não foi possível alterar a senha.', { description: getApiErrorMessage(error) })
      },
    }),
  )

  return (
    <section aria-labelledby="senha-titulo" className="flex flex-col gap-5 lg:max-w-[417px]">
      <h2 id="senha-titulo" className="text-lg font-bold">
        Alterar senha
      </h2>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <PasswordField label="Senha atual" autoComplete="current-password" error={errors.currentPassword?.message} {...register('currentPassword')} />
        <PasswordField
          label="Nova senha"
          autoComplete="new-password"
          hint="Mínimo de 8 caracteres, com letras e números."
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <PasswordField label="Confirmar nova senha" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Button type="submit" size="lg" variant="outline" disabled={change.isPending} className="w-fit">
          {change.isPending ? 'Alterando...' : 'Alterar senha'}
        </Button>
      </form>
    </section>
  )
}
