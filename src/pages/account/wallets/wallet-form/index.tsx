import { useId, type ComponentProps } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { NETWORKS } from '@/enums/NftEnums'
import { walletInputSchema, type Wallet, type WalletInput } from '@/types/wallets/WalletTypes'
import { WALLET_PROVIDERS } from '@/enums/WalletEnums'
import { FormField } from '@/components/inputs/form-field'
import { Button } from '@/components/ui/button'
import { getApiError, getApiErrorMessage } from '@/utils/ApiErrorUtils'
import { useSaveWallet } from '@/hooks/useWallets'

const FIELDS = ['label', 'address', 'network', 'provider', 'ensName'] as const

function isWalletField(value: string): value is (typeof FIELDS)[number] {
  return (FIELDS as readonly string[]).includes(value)
}

type WalletFormProps = {
  role: 'primary' | 'secondary'
  wallet?: Wallet
  onSaved?: () => void
}

function SelectField({
  label,
  error,
  children,
  ...props
}: { label: string; error?: string } & ComponentProps<'select'>) {
  const id = useId()
  return (
    <div className="flex flex-col gap-2">
      <div className="flex text-[15px]">
        <label htmlFor={id}>{label}</label>
        <span aria-hidden className="text-coral">
          *
        </span>
      </div>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-required
        className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-ring aria-invalid:border-destructive"
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={`${id}-error`} className="text-sm text-coral">
          {error}
        </p>
      )}
    </div>
  )
}

export function WalletForm({ role, wallet, onSaved }: WalletFormProps) {
  const save = useSaveWallet()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<WalletInput>({
    resolver: zodResolver(walletInputSchema),
    defaultValues: {
      label: wallet?.label ?? '',
      address: wallet?.address ?? '',
      network: wallet?.network ?? 'ethereum',
      provider: wallet?.provider ?? 'metamask',
      ensName: wallet?.ensName ?? '',
      role,
    },
  })

  const onSubmit = handleSubmit((values) =>
    save.mutate(
      { id: wallet?.id, input: { ...values, role } },
      {
        onSuccess: () => {
          toast.success(role === 'primary' ? 'Carteira principal salva.' : 'Carteira secundária salva.')
          onSaved?.()
        },
        onError: (error) => {
          const fieldErrors = getApiError(error)?.fieldErrors ?? {}
          for (const [field, message] of Object.entries(fieldErrors)) {
            if (isWalletField(field)) setError(field, { message }, { shouldFocus: true })
          }
          if (Object.keys(fieldErrors).length === 0) toast.error('Não foi possível salvar a carteira.', { description: getApiErrorMessage(error) })
        },
      },
    ),
  )

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-2 lg:gap-x-7">
      <FormField label="Apelido da carteira" required error={errors.label?.message} {...register('label')} />
      <FormField
        label="Endereço da carteira"
        required
        placeholder="Endereço 0x da carteira"
        autoComplete="off"
        spellCheck={false}
        error={errors.address?.message}
        {...register('address')}
      />
      <SelectField label="Rede" error={errors.network?.message} {...register('network')}>
        {NETWORKS.map((network) => (
          <option key={network.slug} value={network.slug}>
            {network.label}
          </option>
        ))}
      </SelectField>
      <SelectField label="Tipo de carteira" error={errors.provider?.message} {...register('provider')}>
        {WALLET_PROVIDERS.map((provider) => (
          <option key={provider.slug} value={provider.slug}>
            {provider.label}
          </option>
        ))}
      </SelectField>
      <FormField label="Nome ENS (opcional)" placeholder="exemplo.eth" error={errors.ensName?.message} {...register('ensName')} />
      <div className="flex items-end">
        <Button type="submit" size="lg" disabled={save.isPending}>
          {save.isPending ? 'Salvando...' : 'Salvar carteira'}
        </Button>
      </div>
    </form>
  )
}
