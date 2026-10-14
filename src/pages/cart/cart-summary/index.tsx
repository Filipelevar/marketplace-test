import { useId, useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from 'cn'
import type { Cart } from '@/types/cart/CartTypes'
import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/utils/ApiErrorUtils'
import { displayEth } from '@/utils/EthUtils'
import { useApplyCoupon, useRemoveCoupon } from '@/hooks/useCart'

function CouponForm({ cart }: { cart: Cart }) {
  const inputId = useId()
  const errorId = useId()
  const [code, setCode] = useState('')
  const apply = useApplyCoupon()
  const remove = useRemoveCoupon()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    apply.mutate(
      { code },
      {
        onSuccess: (updated) => {
          setCode('')
          toast.success(`Cupom ${updated.coupon?.code ?? code.toUpperCase()} aplicado.`)
        },
      },
    )
  }

  if (cart.coupon) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-success/50 bg-success/10 px-3 py-2 text-sm">
        <span>
          <strong className="text-foreground">{cart.coupon.code}</strong>
          <span className="block text-xs text-muted-foreground">{cart.coupon.description}</span>
        </span>
        <button
          type="button"
          onClick={() => remove.mutate(undefined, { onSuccess: () => toast.info('Cupom removido.') })}
          disabled={remove.isPending}
          aria-label={`Remover cupom ${cart.coupon.code}`}
          className="grid size-8 place-items-center rounded-md text-muted-foreground hover:text-foreground"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
    )
  }

  const error = apply.isError ? getApiErrorMessage(apply.error) : null

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-bold">
        Código promocional
      </label>
      <div className="flex">
        <input
          id={inputId}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Digite o código promocional..."
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          autoComplete="off"
          className="h-10 min-w-0 flex-1 rounded-l-md border border-r-0 border-primary bg-transparent px-3 text-xs text-foreground placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-ring aria-invalid:border-destructive"
        />
        <Button type="submit" disabled={apply.isPending || code.trim().length === 0} className="rounded-l-none px-5">
          {apply.isPending ? 'Aplicando...' : 'Aplicar'}
        </Button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-coral">
          {error}
        </p>
      )}
    </form>
  )
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className={cn(emphasis && 'font-bold')}>{label}</dt>
      <dd className={cn('text-lg whitespace-nowrap', emphasis && 'font-bold text-highlight')}>{value}</dd>
    </div>
  )
}

export function CartSummary({ cart, isUpdating }: { cart: Cart; isUpdating: boolean }) {
  const { totals } = cart
  const empty = cart.items.length === 0

  return (
    <section aria-labelledby="resumo-titulo" className="flex flex-col gap-5">
      <h2 id="resumo-titulo" className="hidden border-b border-primary/30 pb-3 text-lg font-bold lg:block">
        Resumo da carteira
      </h2>
      {!empty && <CouponForm cart={cart} />}
      <dl aria-busy={isUpdating} aria-live="polite" className={cn('flex flex-col gap-3 transition-opacity', isUpdating && 'opacity-60')}>
        <Row label="Subtotal" value={displayEth(totals.subtotalEth)} />
        <Row label="Desconto do lançamento" value={`(-) ${displayEth(totals.discountEth)}`} />
        <div className="flex flex-col gap-1">
          <Row label="Taxa de rede" value={displayEth(totals.networkFeeEth)} />
          <span className="self-end text-xs text-highlight">Taxa estimada</span>
        </div>
        <div className="border-t border-primary/30 pt-4">
          <Row label="Total" value={displayEth(totals.totalEth)} emphasis />
        </div>
      </dl>
      <Button asChild size="lg" className={cn('rounded-md', empty && 'pointer-events-none opacity-50')}>
        <Link to="/pagamento" aria-disabled={empty || undefined} tabIndex={empty ? -1 : undefined}>
          Conectar e finalizar
        </Link>
      </Button>
      <Link to="/" hash="catalogo" className="text-center text-highlight hover:underline">
        Continuar explorando
      </Link>
    </section>
  )
}
