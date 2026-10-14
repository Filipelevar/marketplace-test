import { useEffect, useEffectEvent, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { AlertTriangle, Loader2 } from 'lucide-react'
import type { CheckoutQuote } from '@/types/checkout/CheckoutTypes'
import type { Wallet } from '@/types/wallets/WalletTypes'
import { FormField } from '@/components/inputs/form-field'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { useCreateQuote, usePlaceOrder } from '@/hooks/useCheckout'
import { OrderItems } from '@/components/order-items'
import { ReviewDialog } from '@/pages/checkout/review-dialog'
import { ConnectionPanel, WalletList } from '@/pages/checkout/wallet-section'
import { checkoutFormSchema, type CheckoutFormValues } from '@/pages/checkout/schema'
import { newIdempotencyKey, readAttempt, readConnection, writeAttempt, writeConnection, type CheckoutAttempt } from '@/stores/checkout-store'
import { useConnectWallet, useDisconnectWallet, useWallets } from '@/hooks/useWallets'
import { onRealtimeNotice, type RealtimeNotice } from '@/services/socket/realtime-bus'
import { getApiError, getApiErrorMessage } from '@/utils/ApiErrorUtils'
import { displayEth } from '@/utils/EthUtils'

function Breadcrumb() {
  return (
    <nav aria-label="Trilha de navegação" className="hidden lg:block">
      <ol className="flex gap-1.5 text-[15px] font-bold">
        <li>
          <Link to="/" className="hover:text-highlight">
            Início
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li>
          <Link to="/carrinho" className="hover:text-highlight">
            Carrinho
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li aria-current="page">Pagamento</li>
      </ol>
    </nav>
  )
}

export function CheckoutPage() {
  const session = useSession()
  const wallets = useWallets()
  const cart = useCart()

  if (session.status !== 'authenticated' || wallets.isPending || cart.isPending) {
    return (
      <div aria-busy className="page-container flex flex-col gap-6 py-10 lg:flex-row">
        <span role="status" className="sr-only">
          Carregando pagamento
        </span>
        <Skeleton className="h-96 flex-1" />
        <Skeleton className="h-96 w-full lg:w-[405px]" />
      </div>
    )
  }

  if (wallets.isError || cart.isError) {
    return (
      <section role="alert" className="page-container flex flex-col items-center gap-4 py-24 text-center">
        <AlertTriangle aria-hidden className="size-10 text-coral" />
        <h1 className="text-xl font-bold">Não foi possível carregar o pagamento.</h1>
        <p className="text-sm text-muted-foreground">{getApiErrorMessage(wallets.error ?? cart.error)}</p>
        <Button onClick={() => void Promise.all([wallets.refetch(), cart.refetch()])}>Tentar novamente</Button>
      </section>
    )
  }

  if (cart.data.items.length === 0 && !readAttempt()) {
    return (
      <section className="page-container flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-xl font-bold">Seu carrinho está vazio</h1>
        <Button asChild>
          <Link to="/" hash="catalogo">
            Explorar o mercado
          </Link>
        </Button>
      </section>
    )
  }

  return <CheckoutForm user={session.user} wallets={wallets.data} cartItems={cart.data} />
}

type CheckoutFormProps = {
  user: { displayName: string; username: string; email: string }
  wallets: Wallet[]
  cartItems: NonNullable<ReturnType<typeof useCart>['data']>
}

function CheckoutForm({ user, wallets, cartItems }: CheckoutFormProps) {
  const navigate = useNavigate()
  const primary = wallets.find((wallet) => wallet.role === 'primary') ?? wallets[0]
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      walletId: primary?.id ?? '',
      network: primary?.network ?? 'ethereum',
      provider: primary?.provider ?? 'metamask',
      referralCode: '',
      note: '',
    },
  })

  const [connection, setConnection] = useState(readConnection)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [quote, setQuote] = useState<CheckoutQuote | null>(null)
  const [previousQuote, setPreviousQuote] = useState<CheckoutQuote | null>(null)
  const [attempt, setAttempt] = useState<CheckoutAttempt | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [quoteStale, setQuoteStale] = useState(false)
  const [recoveringAttempt, setRecoveringAttempt] = useState(() => {
    const pending = readAttempt()
    return pending?.status === 'submitted' && !pending.orderId
  })

  const connect = useConnectWallet()
  const disconnect = useDisconnectWallet()
  const createQuote = useCreateQuote()
  const placeOrder = usePlaceOrder()

  const [walletId, network, provider] = useWatch({ control, name: ['walletId', 'network', 'provider'] })
  const connectionMatches =
    connection !== null && connection.walletId === walletId && connection.network === network && connection.provider === provider

  function rememberAttempt(next: CheckoutAttempt) {
    writeAttempt(next)
    setAttempt(next)
  }

  function submitAttempt(current: CheckoutAttempt) {
    setSubmitError(null)
    const submitted = { ...current, status: 'submitted' as const }
    rememberAttempt(submitted)
    sendAttempt(submitted)
  }

  function sendAttempt(submitted: CheckoutAttempt) {
    const current = { ...submitted, status: 'ready' as const }
    placeOrder.mutate(submitted, {
      onSuccess: (order) => {
        rememberAttempt({ ...submitted, orderId: order.id })
        void navigate({ to: '/pedidos/$orderId', params: { orderId: order.id } })
      },
      onError: (error) => {
        setRecoveringAttempt(false)
        const apiError = getApiError(error)
        if (apiError?.code === 'QUOTE_CHANGED' && apiError.quote) {
          setPreviousQuote(quote)
          setQuote(apiError.quote)
          setReviewOpen(true)
          rememberAttempt({ ...current, quoteId: apiError.quote.id, idempotencyKey: newIdempotencyKey(), status: 'ready' })
          return
        }
        if (apiError?.code === 'WALLET_DISCONNECTED') {
          writeConnection(null)
          setConnection(null)
          setReviewOpen(false)
          setConnectError(apiError.message)
          rememberAttempt({ ...current, status: 'ready' })
          return
        }
        if (apiError?.code === 'IDEMPOTENCY_CONFLICT') {
          rememberAttempt({ ...current, idempotencyKey: newIdempotencyKey(), status: 'ready' })
        } else {
          rememberAttempt({ ...current, status: 'ready' })
        }
        setSubmitError(getApiErrorMessage(error))
      },
    })
  }

  const markQuoteStaleIfAffected = useEffectEvent((notice: RealtimeNotice) => {
    if (notice.type === 'nft-updated' && quote?.items.some((item) => item.nftId === notice.nftId)) setQuoteStale(true)
  })

  useEffect(() => onRealtimeNotice((notice) => markQuoteStaleIfAffected(notice)), [])

  function refreshQuote() {
    createQuote.mutate(undefined, {
      onSuccess: (nextQuote) => {
        setPreviousQuote(quote)
        setQuote(nextQuote)
        setQuoteStale(false)
        if (attempt) {
          rememberAttempt({ ...attempt, quoteId: nextQuote.id, idempotencyKey: newIdempotencyKey(), status: 'ready' })
        }
      },
      onError: (error) => setSubmitError(getApiErrorMessage(error)),
    })
  }

  const recoverPreviousAttempt = useEffectEvent(() => {
    const pending = readAttempt()
    if (pending?.orderId) {
      void navigate({ to: '/pedidos/$orderId', params: { orderId: pending.orderId }, replace: true })
      return
    }
    if (pending?.status === 'submitted') sendAttempt(pending)
  })

  useEffect(() => {
    recoverPreviousAttempt()
  }, [])

  function connectWallet() {
    setConnectError(null)
    connect.mutate(
      { walletId, network, provider },
      {
        onSuccess: (next) => {
          writeConnection(next)
          setConnection(next)
        },
        onError: (error) => setConnectError(getApiErrorMessage(error)),
      },
    )
  }

  function disconnectWallet() {
    if (!connection) return
    disconnect.mutate(connection.id, {
      onSettled: () => {
        writeConnection(null)
        setConnection(null)
      },
    })
  }

  const review = handleSubmit((values) => {
    if (!connection || !connectionMatches) {
      setError('root', { message: 'Conecte a carteira selecionada antes de revisar o pedido.' })
      return
    }
    const collector = {
      displayName: values.displayName,
      username: values.username,
      email: values.email,
      referralCode: values.referralCode,
      note: values.note,
    }
    createQuote.mutate(undefined, {
      onSuccess: (nextQuote) => {
        setPreviousQuote(null)
        setQuote(nextQuote)
        setQuoteStale(false)
        setSubmitError(null)
        rememberAttempt({
          idempotencyKey: newIdempotencyKey(),
          quoteId: nextQuote.id,
          connectionId: connection.id,
          collector,
          status: 'ready',
          orderId: null,
        })
        setReviewOpen(true)
      },
      onError: (error) => setError('root', { message: getApiErrorMessage(error) }),
    })
  })

  const recovering = recoveringAttempt || (placeOrder.isPending && placeOrder.failureCount > 0)

  return (
    <div className="page-container flex flex-col gap-6 pt-6 lg:pt-8">
      <Breadcrumb />
      <h1 className="text-2xl font-bold lg:sr-only">Pagamento com carteira</h1>

      {recoveringAttempt && (
        <p role="status" className="flex items-center gap-2 rounded-md border border-amber/50 bg-amber/10 px-4 py-3 text-sm text-amber">
          <Loader2 aria-hidden className="size-4 animate-spin" />
          Recuperando o pedido enviado anteriormente, sem criar outra compra...
        </p>
      )}

      <form onSubmit={review} noValidate className="flex flex-col gap-10 lg:flex-row lg:gap-8">
        <section aria-labelledby="colecionador-titulo" className="flex min-w-0 flex-1 flex-col gap-5">
          <h2 id="colecionador-titulo" className="text-lg font-bold">
            Perfil do colecionador
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Nome de exibição" required error={errors.displayName?.message} {...register('displayName')} />
            <FormField label="Nome de usuário" required error={errors.username?.message} {...register('username')} />
            <FormField label="E-mail" type="email" required error={errors.email?.message} {...register('email')} />
            <FormField
              label="Código de indicação (opcional)"
              error={errors.referralCode?.message}
              {...register('referralCode')}
            />
          </div>
          <WalletList wallets={wallets} register={register} errors={errors} />
          <div className="flex flex-col gap-2">
            <label htmlFor="observacao" className="text-[15px]">
              Observação do colecionador (opcional)
            </label>
            <textarea
              id="observacao"
              rows={5}
              aria-invalid={errors.note ? true : undefined}
              aria-describedby={errors.note ? 'observacao-erro' : undefined}
              className="rounded-md border border-border bg-transparent p-3 text-sm focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-ring"
              {...register('note')}
            />
            {errors.note && (
              <p id="observacao-erro" className="text-sm text-coral">
                {errors.note.message}
              </p>
            )}
          </div>
        </section>

        <aside aria-label="Resumo do pedido" className="flex w-full flex-col gap-6 lg:w-[405px]">
          <section aria-labelledby="seus-nfts-titulo" className="flex flex-col gap-3">
            <h2 id="seus-nfts-titulo" className="text-lg font-bold">
              Seus NFTs
            </h2>
            <OrderItems items={cartItems.items} caption="NFTs no carrinho" />
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{displayEth(cartItems.totals.subtotalEth)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Desconto do lançamento</dt>
                <dd>(-) {displayEth(cartItems.totals.discountEth)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Taxa de rede</dt>
                <dd>{displayEth(cartItems.totals.networkFeeEth)}</dd>
              </div>
              <div className="flex justify-between border-t border-primary/30 pt-2 text-base font-bold">
                <dt>Total</dt>
                <dd className="text-highlight">{displayEth(cartItems.totals.totalEth)}</dd>
              </div>
            </dl>
          </section>

          <ConnectionPanel
            register={register}
            errors={errors}
            connection={connection}
            connectionMatches={connectionMatches}
            connecting={connect.isPending}
            disconnecting={disconnect.isPending}
            connectError={connectError}
            onConnect={connectWallet}
            onDisconnect={disconnectWallet}
          />

          {errors.root && (
            <p role="alert" className="rounded-md border border-coral/50 bg-coral/10 px-4 py-3 text-sm text-coral">
              {errors.root.message}
            </p>
          )}
          <Button type="submit" size="lg" disabled={createQuote.isPending}>
            {createQuote.isPending ? 'Cotando...' : 'Confirmar compra'}
          </Button>
        </aside>
      </form>

      {quote && connection && attempt && (
        <ReviewDialog
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          quote={quote}
          previousQuote={previousQuote}
          connection={connection}
          submitting={placeOrder.isPending}
          recovering={recovering}
          error={submitError}
          stale={quoteStale}
          refreshing={createQuote.isPending}
          onRefreshQuote={refreshQuote}
          onConfirm={() => submitAttempt(attempt)}
        />
      )}
    </div>
  )
}
