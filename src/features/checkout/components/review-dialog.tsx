import { AlertTriangle, Loader2 } from 'lucide-react'
import type { CheckoutQuote } from '@/contracts/checkout'
import { shortAddress, WALLET_PROVIDERS, type WalletConnection } from '@/contracts/wallet'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { networkLabel } from '@/features/catalog/format'
import { displayEth } from '@/lib/eth'
import { OrderItems } from './order-items'

type ReviewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  quote: CheckoutQuote
  previousQuote: CheckoutQuote | null
  connection: WalletConnection
  submitting: boolean
  recovering: boolean
  error: string | null
  onConfirm: () => void
}

function PriceChanges({ previous, current }: { previous: CheckoutQuote; current: CheckoutQuote }) {
  const changes = current.items.flatMap((item) => {
    const before = previous.items.find((candidate) => candidate.id === item.id)
    if (!before) return [`${item.name} foi adicionado ao pedido.`]
    const notes: string[] = []
    if (before.unitPriceEth !== item.unitPriceEth) {
      notes.push(`${item.name}: preço de ${displayEth(before.unitPriceEth)} para ${displayEth(item.unitPriceEth)}.`)
    }
    if (before.quantity !== item.quantity) notes.push(`${item.name}: quantidade de ${before.quantity} para ${item.quantity}.`)
    return notes
  })
  for (const item of previous.items) {
    if (!current.items.some((candidate) => candidate.id === item.id)) changes.push(`${item.name} saiu do pedido.`)
  }
  if (previous.coupon?.code !== current.coupon?.code) changes.push('O cupom aplicado mudou.')

  return (
    <div role="alert" className="flex flex-col gap-2 rounded-md border border-amber/50 bg-amber/10 p-4 text-sm text-amber">
      <p className="flex items-center gap-2 font-bold">
        <AlertTriangle aria-hidden className="size-4" />
        A cotação mudou desde a sua revisão
      </p>
      <ul className="list-disc pl-5">
        {changes.map((change) => (
          <li key={change}>{change}</li>
        ))}
      </ul>
      <p>
        Total anterior: <s>{displayEth(previous.totals.totalEth)}</s> · Novo total:{' '}
        <strong>{displayEth(current.totals.totalEth)}</strong>
      </p>
      <p>Confirme novamente para continuar com os novos valores.</p>
    </div>
  )
}

export function ReviewDialog({
  open,
  onOpenChange,
  quote,
  previousQuote,
  connection,
  submitting,
  recovering,
  error,
  onConfirm,
}: ReviewDialogProps) {
  const blocked = quote.issues.length > 0
  const provider = WALLET_PROVIDERS.find((item) => item.slug === connection.provider)?.label ?? connection.provider

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto border-b-[10px] border-primary bg-card p-6 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Revisar pedido</DialogTitle>
          <DialogDescription>
            Confira os valores cotados agora. O pagamento será solicitado na sua carteira {provider}.
          </DialogDescription>
        </DialogHeader>

        {previousQuote && <PriceChanges previous={previousQuote} current={quote} />}
        {blocked && (
          <div role="alert" className="rounded-md border border-coral/50 bg-coral/10 p-4 text-sm text-coral">
            {quote.issues.map((issue) => (
              <p key={issue.itemId}>
                {issue.kind === 'sold-out'
                  ? `${issue.name} esgotou.`
                  : `${issue.name}: apenas ${issue.available} disponível(is).`}
              </p>
            ))}
            <p className="mt-2">Ajuste o carrinho para continuar.</p>
          </div>
        )}

        <OrderItems items={quote.items} caption="Itens do pedido" />

        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{displayEth(quote.totals.subtotalEth)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Desconto{quote.coupon ? ` (${quote.coupon.code})` : ''}</dt>
            <dd>(-) {displayEth(quote.totals.discountEth)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Taxa de rede</dt>
            <dd>{displayEth(quote.totals.networkFeeEth)}</dd>
          </div>
          <div className="flex justify-between border-t border-primary/30 pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd className="text-highlight">{displayEth(quote.totals.totalEth)}</dd>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <dt>Carteira</dt>
            <dd>
              {shortAddress(connection.address)} · {networkLabel(connection.network)}
            </dd>
          </div>
        </dl>

        <div aria-live="polite">
          {recovering && (
            <p className="flex items-center gap-2 text-sm text-amber">
              <Loader2 aria-hidden className="size-4 animate-spin" />
              Não recebemos a confirmação. Verificando seu pedido sem criar outra compra...
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-md border border-coral/50 bg-coral/10 px-4 py-3 text-sm text-coral">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={submitting}>
            Voltar
          </Button>
          <Button type="button" onClick={onConfirm} disabled={submitting || blocked} size="lg">
            {submitting ? 'Processando...' : previousQuote ? 'Confirmar com novos valores' : 'Confirmar pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
