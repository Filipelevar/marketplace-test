import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { newsletterSubscriptionSchema, type NewsletterSubscriptionInput } from '@/types/newsletter/NewsletterTypes'
import { getApiError, getApiErrorMessage } from '@/utils/ApiErrorUtils'
import { useSubscribeToNewsletter } from '@/hooks/useNewsletter'

export function NewsletterForm() {
  const inputId = useId()
  const messageId = useId()
  const subscribe = useSubscribeToNewsletter()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<NewsletterSubscriptionInput>({ resolver: zodResolver(newsletterSubscriptionSchema) })

  const onSubmit = handleSubmit((values) => {
    subscribe.mutate(values, {
      onSuccess: () => reset(),
      onError: (error) => {
        const fieldError = getApiError(error)?.fieldErrors?.email
        if (fieldError) setError('email', { message: fieldError })
      },
    })
  })

  const fieldError = errors.email?.message
  const requestError = subscribe.isError && !fieldError ? getApiErrorMessage(subscribe.error) : null

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-2">
      <label htmlFor={inputId} className="sr-only">
        E-mail para receber novidades
      </label>
      <div className="flex h-10 overflow-hidden rounded-md bg-background">
        <input
          id={inputId}
          type="email"
          autoComplete="email"
          placeholder="digite seu e-mail..."
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={messageId}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground placeholder:text-subtle focus-visible:outline-none"
          {...register('email')}
        />
        <button
          type="submit"
          disabled={subscribe.isPending}
          className="bg-primary px-4 text-base font-bold text-primary-foreground transition-colors hover:bg-primary-light disabled:opacity-60"
        >
          {subscribe.isPending ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
      <p id={messageId} aria-live="polite" className="min-h-5 text-xs">
        {fieldError && <span className="text-coral">{fieldError}</span>}
        {requestError && <span className="text-coral">{requestError}</span>}
        {subscribe.isSuccess && <span className="text-success">Inscrição confirmada. Até o próximo lançamento!</span>}
      </p>
    </form>
  )
}
