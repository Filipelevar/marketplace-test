import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from 'cn'
import { Input } from '@/components/ui/input'

type FormFieldProps = Omit<ComponentProps<typeof Input>, 'id'> & {
  label: string
  error?: string
  hideLabel?: boolean
  required?: boolean
  hint?: ReactNode
}

export function FormField({ label, error, hideLabel, required, hint, className, ...inputProps }: FormFieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-2">
      <div className={cn('flex text-[15px]', hideLabel && 'sr-only')}>
        <label htmlFor={id}>{label}</label>
        {required && (
          <span aria-hidden className="text-coral">
            *
          </span>
        )}
      </div>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        className={className}
        {...inputProps}
      />
      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-coral">
          {error}
        </p>
      )}
    </div>
  )
}

export function PasswordField(props: Omit<FormFieldProps, 'type'>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <FormField {...props} type={visible ? 'text' : 'password'} className={cn('pr-11', props.className)} />
      <button
        type="button"
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
        className={cn(
          'absolute right-1 grid size-9 place-items-center rounded-md text-subtle hover:text-foreground',
          props.hideLabel ? 'top-0.5' : 'top-[1.85rem]',
        )}
      >
        {visible ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
      </button>
    </div>
  )
}
