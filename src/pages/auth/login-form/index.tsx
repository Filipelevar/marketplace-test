import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { loginSchema, type LoginInput } from '@/types/auth/AuthTypes'
import { FormField, PasswordField } from '@/components/inputs/form-field'
import { Button } from '@/components/ui/button'
import { getApiError, getApiErrorMessage } from '@/utils/ApiErrorUtils'
import { useLogin } from '@/hooks/useAuth'

export function LoginForm({ onAuthenticated }: { onAuthenticated: () => void }) {
  const login = useLogin()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onSubmit = handleSubmit((values) =>
    login.mutate(values, {
      onSuccess: () => {
        toast.success('Bem-vindo de volta!')
        onAuthenticated()
      },
      onError: (error) => {
        const fieldErrors = getApiError(error)?.fieldErrors
        if (fieldErrors?.email) setError('email', { message: fieldErrors.email })
      },
    }),
  )

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      {login.isError && !getApiError(login.error)?.fieldErrors && (
        <p role="alert" className="rounded-md border border-coral/50 bg-coral/10 px-4 py-3 text-sm text-coral">
          {getApiErrorMessage(login.error)}
        </p>
      )}
      <FormField
        label="E-mail"
        hideLabel
        type="email"
        autoComplete="email"
        placeholder="contato@email.com"
        error={errors.email?.message}
        required
        {...register('email')}
      />
      <PasswordField
        label="Senha"
        hideLabel
        autoComplete="current-password"
        placeholder="Senha"
        error={errors.password?.message}
        required
        {...register('password')}
      />
      <button
        type="button"
        onClick={() => toast.info('Recuperação de senha não está disponível nesta demonstração.')}
        className="self-end text-[13px] text-highlight hover:underline"
      >
        Esqueceu a senha?
      </button>
      <Button type="submit" size="lg" disabled={login.isPending} className="mt-4">
        {login.isPending ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}
