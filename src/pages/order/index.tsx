import { useEffect, useRef } from 'react'
import { getRouteApi, Link } from '@tanstack/react-router'
import { AlertTriangle, Loader2, SearchX, XCircle } from 'lucide-react'
import { isTerminal, type Order } from '@/types/checkout/CheckoutTypes'
import { shortAddress } from '@/types/wallets/WalletTypes'
import { WALLET_PROVIDERS } from '@/enums/WalletEnums'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import thankYou from '@/assets/brand/thank-you.svg'
import { networkLabel } from '@/utils/FormatUtils'
import { useOrder, useSettleOrderSideEffects } from '@/hooks/useCheckout'
import { OrderItems } from '@/components/order-items'
import { clearAttempt, readAttempt } from '@/stores/checkout-store'
import { getApiError, getApiErrorMessage } from '@/utils/ApiErrorUtils'
import { displayEth } from '@/utils/EthUtils'

const route = getRouteApi('/_autenticado/pedidos/$orderId')

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

function ExplorerDialog({ order }: { order: Order }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg">Ver no explorador</Button>
      </DialogTrigger>
      <DialogContent className="bg-card p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Explorador de blocos (simulado)</DialogTitle>
          <DialogDescription>
            Esta demonstração não publica transações em uma blockchain real. Os dados abaixo são simulados.
          </DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Hash</dt>
          <dd className="font-mono break-all">{order.transactionHash}</dd>
          <dt className="text-muted-foreground">Bloco</dt>
          <dd>{order.blockNumber?.toLocaleString('pt-BR')}</dd>
          <dt className="text-muted-foreground">Rede</dt>
          <dd>{networkLabel(order.wallet.network)}</dd>
          <dt className="text-muted-foreground">Status</dt>
          <dd className="text-success">Sucesso</dd>
        </dl>
      </DialogContent>
    </Dialog>
  )
}

function Receipt({ order }: { order: Order }) {
  const provider = WALLET_PROVIDERS.find((item) => item.slug === order.wallet.provider)?.label ?? order.wallet.provider
  return (
    <section
      aria-labelledby="recibo-titulo"
      className="mx-auto w-full max-w-[578px] border-b-[10px] border-primary bg-card"
    >
      <header className="flex flex-col items-center gap-4 px-6 pt-6 pb-5 text-center">
        <img src={thankYou} alt="" width={80} height={80} />
        <h1 id="recibo-titulo" className="text-base font-bold text-muted-foreground">
          Seus NFTs agora estão na sua carteira
        </h1>
      </header>
      <dl className="grid grid-cols-2 gap-4 border-y border-primary px-6 py-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="font-bold text-muted-foreground">ID da transação</dt>
          <dd className="font-mono" title={order.transactionHash ?? undefined}>
            {order.transactionHash ? shortAddress(order.transactionHash) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Data</dt>
          <dd>{dateFormatter.format(new Date(order.confirmedAt ?? order.createdAt))}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Total</dt>
          <dd>{displayEth(order.totals.totalEth)}</dd>
        </div>
        <div>
          <dt className="font-bold text-muted-foreground">Carteira</dt>
          <dd>{provider}</dd>
        </div>
      </dl>
      <div className="flex flex-col gap-4 px-6 py-6 sm:px-11">
        <h2 className="font-bold">Detalhes da transação</h2>
        <OrderItems items={order.items} caption="NFTs comprados" />
        <dl className="flex flex-col gap-2 text-sm">
          {order.coupon && (
            <div className="flex justify-between">
              <dt>Desconto ({order.coupon.code})</dt>
              <dd>(-) {displayEth(order.totals.discountEth)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Taxa de rede</dt>
            <dd>{displayEth(order.totals.networkFeeEth)}</dd>
          </div>
          <div className="flex justify-between border-b border-primary/30 pb-3 text-base font-bold">
            <dt>Total</dt>
            <dd className="text-highlight">{displayEth(order.totals.totalEth)}</dd>
          </div>
        </dl>
        <p className="text-center text-sm text-muted-foreground">
          Transação confirmada na {networkLabel(order.wallet.network)}. A propriedade foi transferida para a carteira{' '}
          {shortAddress(order.wallet.address)} e registrada na rede.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <ExplorerDialog order={order} />
          <Button asChild size="lg" variant="outline">
            <Link to="/" hash="catalogo">
              Continuar explorando
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export function OrderPage() {
  const { orderId } = route.useParams()
  const { data: order, isPending, isError, error, refetch } = useOrder(orderId)
  const settle = useSettleOrderSideEffects()
  const settled = useRef(false)

  useEffect(() => {
    if (!order || !isTerminal(order.status) || settled.current) return
    settled.current = true
    settle(order)
    if (readAttempt()?.orderId === order.id) clearAttempt()
  }, [order, settle])

  if (isPending) {
    return (
      <div aria-busy className="page-container py-12">
        <span role="status" className="sr-only">
          Carregando pedido
        </span>
        <Skeleton className="mx-auto h-[600px] w-full max-w-[578px]" />
      </div>
    )
  }

  if (isError) {
    const notFound = getApiError(error)?.code === 'NOT_FOUND'
    return (
      <section role="alert" className="page-container flex flex-col items-center gap-4 py-24 text-center">
        {notFound ? <SearchX aria-hidden className="size-10 text-primary" /> : <AlertTriangle aria-hidden className="size-10 text-coral" />}
        <h1 className="text-xl font-bold">{notFound ? 'Pedido não encontrado' : 'Não foi possível carregar o pedido.'}</h1>
        <p className="text-sm text-muted-foreground">{getApiErrorMessage(error)}</p>
        {!notFound && <Button onClick={() => void refetch()}>Tentar novamente</Button>}
      </section>
    )
  }

  return (
    <div className="page-container py-10 lg:py-16">
      <title>{order.status === 'confirmed' ? 'Pedido confirmado | Kurio' : 'Pedido | Kurio'}</title>
      {order.status === 'pending' && (
        <section role="status" aria-live="polite" className="mx-auto flex max-w-lg flex-col items-center gap-4 bg-card px-6 py-16 text-center">
          <Loader2 aria-hidden className="size-10 animate-spin text-primary" />
          <h1 className="text-xl font-bold">Processando pagamento</h1>
          <p className="text-sm text-muted-foreground">
            Aguardando a confirmação da carteira para o pedido {order.id}. Você pode recarregar a página sem criar outra compra.
          </p>
          <p className="text-lg font-bold text-highlight">{displayEth(order.totals.totalEth)}</p>
        </section>
      )}
      {order.status === 'declined' && (
        <section role="alert" className="mx-auto flex max-w-lg flex-col items-center gap-4 bg-card px-6 py-16 text-center">
          <XCircle aria-hidden className="size-10 text-coral" />
          <h1 className="text-xl font-bold">Pagamento recusado</h1>
          <p className="text-sm text-muted-foreground">{order.failureReason}</p>
          <p className="text-sm text-muted-foreground">Seus itens continuam no carrinho para você tentar novamente.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/pagamento">Tentar novamente</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/carrinho">Ver carrinho</Link>
            </Button>
          </div>
        </section>
      )}
      {order.status === 'confirmed' && <Receipt order={order} />}
    </div>
  )
}
