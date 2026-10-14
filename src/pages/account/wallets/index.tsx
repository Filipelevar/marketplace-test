import { useState } from 'react'
import { AlertTriangle, ArrowUpCircle, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { Wallet } from '@/types/wallets/WalletTypes'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSaveWallet, useWallets } from '@/hooks/useWallets'
import { WalletForm } from '@/pages/account/wallets/wallet-form'
import { getApiErrorMessage } from '@/utils/ApiErrorUtils'

function PromoteButton({ wallet }: { wallet: Wallet }) {
  const save = useSaveWallet()
  function promote() {
    save.mutate(
      {
        id: wallet.id,
        input: {
          label: wallet.label,
          address: wallet.address,
          network: wallet.network,
          provider: wallet.provider,
          ensName: wallet.ensName ?? '',
          role: 'primary',
        },
      },
      {
        onSuccess: () => toast.success(`${wallet.label} agora é a carteira principal.`),
        onError: (error) => toast.error('Não foi possível alterar a carteira principal.', { description: getApiErrorMessage(error) }),
      },
    )
  }
  return (
    <Button type="button" variant="link" onClick={promote} disabled={save.isPending} className="h-auto px-0">
      <ArrowUpCircle aria-hidden />
      Tornar principal
    </Button>
  )
}

export function WalletsPage() {
  const { data: wallets, isPending, isError, error, refetch } = useWallets()
  const [addingSecondary, setAddingSecondary] = useState(false)

  if (isPending) {
    return (
      <div aria-busy className="flex flex-col gap-6">
        <span role="status" className="sr-only">
          Carregando carteiras
        </span>
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div role="alert" className="flex flex-col items-center gap-4 bg-card px-6 py-16 text-center">
        <AlertTriangle aria-hidden className="size-10 text-coral" />
        <p className="font-bold">Não foi possível carregar suas carteiras.</p>
        <p className="text-sm text-muted-foreground">{getApiErrorMessage(error)}</p>
        <Button onClick={() => void refetch()}>Tentar novamente</Button>
      </div>
    )
  }

  const primary = wallets.find((wallet) => wallet.role === 'primary')
  const secondary = wallets.find((wallet) => wallet.role === 'secondary')

  return (
    <div className="flex flex-col gap-12">
      <h1 className="sr-only">Carteiras</h1>
      <section aria-labelledby="carteira-principal" className="flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h2 id="carteira-principal" className="text-lg font-bold">
            Carteira principal
          </h2>
          <p className="text-sm text-muted-foreground">
            Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
          </p>
        </header>
        <WalletForm key={primary?.id ?? 'novo-principal'} role="primary" wallet={primary} />
      </section>

      <section aria-labelledby="carteira-secundaria" className="flex flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="carteira-secundaria" className="text-lg font-bold">
            Carteira secundária
          </h2>
          {secondary && <PromoteButton wallet={secondary} />}
          {!secondary && primary && !addingSecondary && (
            <Button type="button" variant="link" onClick={() => setAddingSecondary(true)} className="h-auto px-0">
              <Plus aria-hidden />
              Adicionar
            </Button>
          )}
        </header>
        {secondary ? (
          <WalletForm key={secondary.id} role="secondary" wallet={secondary} />
        ) : addingSecondary ? (
          <WalletForm role="secondary" onSaved={() => setAddingSecondary(false)} />
        ) : (
          <p className="text-sm text-muted-foreground">
            {primary
              ? 'Você ainda não adicionou uma carteira secundária.'
              : 'Cadastre primeiro a carteira principal para adicionar uma secundária.'}
          </p>
        )}
      </section>
    </div>
  )
}
