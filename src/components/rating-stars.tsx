import { Star } from 'lucide-react'
import { cn } from 'cn'

const ratingFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export function RatingStars({ value, className }: { value: number; className?: string }) {
  const filled = Math.round(value)
  return (
    <span role="img" aria-label={`Avaliação ${ratingFormatter.format(value)} de 5`} className={cn('flex gap-0.5', className)}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          aria-hidden
          className={cn('size-3.5', index < filled ? 'fill-amber text-amber' : 'text-subtle')}
        />
      ))}
    </span>
  )
}
