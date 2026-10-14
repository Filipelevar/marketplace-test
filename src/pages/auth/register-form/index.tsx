import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { registerSchema, type RegisterInput } from '@/types/auth/AuthTypes'
import { FormField, PasswordField } from '@/components/inputs/form-field'
import { Button } from '@/components/ui/button'
import { getApiError, getApiErrorMessage } from '@/utils/ApiErrorUtils'
import { useRegister } from '@/hooks/useAuth'

const FIELDS = ['username', 'email', 'password', 'confirmPassword'] as const

function isRegisterField(value: string): value is (typeof FIELDS)[number] {
  return (FIELDS as readonly string[]).includes(value)
}

export function RegisterForm({ onAuthenticated }: { onAuthenticated: () => void }) {
  const registration = useRegister()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  const onSubmit = handleSubmit((values) =>
    registration.mutate(values, {
      onSuccess: () => {
        toast.success('Conta criada! Boas-vindas à Kurio.')
        onAuthenticated()
      },
      onError: (error) => {
        const fieldErrors = getApiError(error)?.fieldErrors ?? {}
        for (const [field, message] of Object.entries(fieldErrors)) {
          if (isRegisterField(field)) setError(field, { message }, { shouldFocus: true })
        }
      },
    }),
  )

  const apiError = registration.isError ? getApiError(registration.error) : null

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      {registration.isError && (
        <p role="alert" className="rounded-md border border-coral/50 bg-coral/10 px-4 py-3 text-sm text-coral">
          {apiError?.message ?? getApiErrorMessage(registration.error)}
        </p>
      )}
      <FormField
        label="Nome de usuário"
        hideLabel
        autoComplete="username"
        placeholder="Nome de usuário"
        error={errors.username?.message}
        required
        {...register('username')}
      />
      <FormField
        label="E-mail"
        hideLabel
        type="email"
        autoComplete="email"
        placeholder="Digite seu e-mail"
        error={errors.email?.message}
        required
        {...register('email')}
      />
      <PasswordField
        label="Senha"
        hideLabel
        autoComplete="new-password"
        placeholder="Senha"
        error={errors.password?.message}
        hint="Mínimo de 8 caracteres, com letras e números."
        required
        {...register('password')}
      />
      <PasswordField
        label="Confirmar senha"
        hideLabel
        autoComplete="new-password"
        placeholder="Confirmar senha"
        error={errors.confirmPassword?.message}
        required
        {...register('confirmPassword')}
      />
      <Button type="submit" size="lg" disabled={registration.isPending} className="mt-4">
        {registration.isPending ? 'Criando conta...' : 'Criar conta'}
      </Button>
    </form>
  )
}
