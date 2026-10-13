import { useId } from 'react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { CheckCircle2, Unplug } from 'lucide-react'
import { cn } from 'cn'
import { NETWORKS } from '@/contracts/nft'
import { shortAddress, WALLET_PROVIDERS, type Wallet, type WalletConnection } from '@/contracts/wallet'
import { Button } from '@/components/ui/button'
import { networkLabel } from '@/features/catalog/format'
import type { CheckoutFormValues } from '../form-schema'

const providerLabel = (slug: string) => WALLET_PROVIDERS.find((provider) => provider.slug === slug)?.label ?? slug

type WalletSectionProps = {
  wallets: Wallet[]
  register: UseFormRegister<CheckoutFormValues>
  errors: FieldErrors<CheckoutFormValues>
  connection: WalletConnection | null
  connectionMatches: boolean
  connecting: boolean
  disconnecting: boolean
  connectError: string | null
  onConnect: () => void
  onDisconnect: () => void
}

export function WalletList({ wallets, register, errors }: Pick<WalletSectionProps, 'wallets' | 'register' | 'errors'>) {
  const errorId = useId()
  return (
    <fieldset className="flex flex-col gap-3" aria-describedby={errors.walletId ? errorId : undefined}>
      <legend className="mb-3 text-[15px]">
        Carteira cadastrada<span aria-hidden className="text-coral">*</span>
      </legend>
      {wallets.length === 0 && (
        <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground">
          Você ainda não tem carteiras cadastradas. Cadastre uma carteira principal no seu perfil para concluir a compra.
        </p>
      )}
      {wallets.map((wallet) => (
        <label
          key={wallet.id}
          className="flex cursor-pointer items-start gap-4 rounded-2xl bg-card p-4 transition-colors has-checked:ring-1 has-checked:ring-primary has-focus-visible:outline-2 has-focus-visible:outline-ring"
        >
          <input type="radio" value={wallet.id} className="mt-1 size-4 accent-primary" {...register('walletId')} />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="font-bold">
              {wallet.label} {wallet.role === 'primary' && <span className="text-xs font-normal text-highlight">(principal)</span>}
            </span>
            <span className="truncate text-sm text-muted-foreground">{wallet.ensName ?? shortAddress(wallet.address)}</span>
            <span className="text-sm text-muted-foreground">Rede {networkLabel(wallet.network)}</span>
          </span>
        </label>
      ))}
      {errors.walletId && (
        <p id={errorId} className="text-sm text-coral">
          {errors.walletId.message}
        </p>
      )}
    </fieldset>
  )
}

export function ConnectionPanel({
  register,
  errors,
  connection,
  connectionMatches,
  connecting,
  disconnecting,
  connectError,
  onConnect,
  onDisconnect,
}: Omit<WalletSectionProps, 'wallets'>) {
  const networkId = useId()
  return (
    <section aria-labelledby="carteira-rede-titulo" className="flex flex-col gap-4">
      <h2 id="carteira-rede-titulo" className="text-center text-base font-bold">
        Carteira e rede
      </h2>
      <div className="flex flex-col gap-2">
        <label htmlFor={networkId} className="text-sm">
          Rede de pagamento
        </label>
        <select
          id={networkId}
          aria-invalid={errors.network ? true : undefined}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          {...register('network')}
        >
          {NETWORKS.map((network) => (
            <option key={network.slug} value={network.slug}>
              {network.label}
            </option>
          ))}
        </select>
      </div>
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">Como conectar a carteira</legend>
        {WALLET_PROVIDERS.map((provider) => (
          <label
            key={provider.slug}
            className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-4 py-3 transition-colors has-checked:border-primary has-focus-visible:outline-2 has-focus-visible:outline-ring"
          >
            <input type="radio" value={provider.slug} className="size-4 accent-primary" {...register('provider')} />
            {provider.label}
          </label>
        ))}
      </fieldset>

      <div aria-live="polite" className="flex flex-col gap-3">
        {connection && connectionMatches ? (
          <div className="flex items-center justify-between gap-3 rounded-md border border-success/50 bg-success/10 px-4 py-3 text-sm">
            <span className="flex items-center gap-2">
              <CheckCircle2 aria-hidden className="size-5 text-success" />
              <span>
                Conectada via {providerLabel(connection.provider)} · {shortAddress(connection.address)} ·{' '}
                {networkLabel(connection.network)}
              </span>
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={onDisconnect} disabled={disconnecting}>
              <Unplug aria-hidden />
              Desconectar
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" onClick={onConnect} disabled={connecting}>
            {connecting ? 'Aguardando a carteira...' : 'Conectar carteira'}
          </Button>
        )}
        {connectError && (
          <p role="alert" className={cn('rounded-md border border-coral/50 bg-coral/10 px-4 py-3 text-sm text-coral')}>
            {connectError}
          </p>
        )}
      </div>
    </section>
  )
}
