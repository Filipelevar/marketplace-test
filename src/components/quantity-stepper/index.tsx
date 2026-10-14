import { Minus, Plus } from 'lucide-react'
import { cn } from 'cn'

type QuantityStepperProps = {
  value: number
  min?: number
  max: number
  onChange: (value: number) => void
  label: string
  disabled?: boolean
  className?: string
}

const stepButton =
  'grid size-[31px] place-items-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:bg-secondary disabled:text-subtle'

export function QuantityStepper({ value, min = 1, max, onChange, label, disabled, className }: QuantityStepperProps) {
  return (
    <div role="group" aria-label={label} className={cn('flex items-center gap-3', className)}>
      <button
        type="button"
        aria-label="Diminuir quantidade"
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
        className={stepButton}
      >
        <Minus aria-hidden className="size-4" />
      </button>
      <output aria-live="polite" className="min-w-6 text-center text-lg">
        {value}
      </output>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
        className={stepButton}
      >
        <Plus aria-hidden className="size-4" />
      </button>
    </div>
  )
}
