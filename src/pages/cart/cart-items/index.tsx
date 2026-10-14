import { Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { CartItem } from '@/types/cart/CartTypes'
import { QuantityStepper } from '@/components/quantity-stepper'
import { getApiErrorMessage } from '@/utils/ApiErrorUtils'
import { displayEth } from '@/utils/EthUtils'
import { useRemoveCartItem, useUpdateCartItem } from '@/hooks/useCart'

function useItemActions(item: CartItem) {
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()

  function changeQuantity(quantity: number) {
    update.mutate(
      { itemId: item.id, quantity },
      { onError: (error) => toast.error('Não foi possível alterar a quantidade.', { description: getApiErrorMessage(error) }) },
    )
  }

  function removeItem() {
    remove.mutate(item.id, {
      onSuccess: () => toast.success(`${item.name} removido do carrinho.`),
      onError: (error) => toast.error('Não foi possível remover o item.', { description: getApiErrorMessage(error) }),
    })
  }

  return { changeQuantity, removeItem, busy: update.isPending || remove.isPending }
}

function ItemIdentity({ item }: { item: CartItem }) {
  return (
    <div className="flex min-w-0 items-center gap-4">
      <img src={item.image.thumb} alt="" width={480} height={480} loading="lazy" className="size-[70px] shrink-0 rounded-sm object-cover" />
      <div className="min-w-0">
        <Link
          to="/nfts/$nftId"
          params={{ nftId: item.nftId }}
          search={{ edition: item.editionId }}
          className="block truncate font-bold hover:text-highlight"
        >
          {item.name}
        </Link>
        <p className="text-sm text-muted-foreground">ID do token: {item.tokenId}</p>
        <p className="text-sm text-muted-foreground">Edição: {item.editionLabel}</p>
      </div>
    </div>
  )
}

export function CartItemRow({ item }: { item: CartItem }) {
  const { changeQuantity, removeItem, busy } = useItemActions(item)
  return (
    <tr aria-busy={busy} className="bg-card">
      <th scope="row" className="p-3 text-left font-normal">
        <ItemIdentity item={item} />
      </th>
      <td className="p-3 font-bold text-highlight">{displayEth(item.unitPriceEth)}</td>
      <td className="p-3">
        <QuantityStepper
          label={`Quantidade de ${item.name}`}
          value={item.quantity}
          max={item.maxQuantity}
          disabled={busy}
          onChange={changeQuantity}
          className="gap-2"
        />
      </td>
      <td className="p-3 font-bold text-highlight">{displayEth(item.lineTotalEth)}</td>
      <td className="p-3">
        <button
          type="button"
          onClick={removeItem}
          disabled={busy}
          aria-label={`Remover ${item.name} do carrinho`}
          className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <Trash2 aria-hidden className="size-5" />
        </button>
      </td>
    </tr>
  )
}

export function CartItemCard({ item }: { item: CartItem }) {
  const { changeQuantity, removeItem, busy } = useItemActions(item)
  return (
    <li aria-busy={busy} className="flex gap-4 rounded-2xl bg-card p-2 pr-4">
      <img src={item.image.thumb} alt="" width={480} height={480} loading="lazy" className="size-[100px] shrink-0 rounded-xl object-cover" />
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 py-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link to="/nfts/$nftId" params={{ nftId: item.nftId }} className="block truncate font-bold">
              {item.name}
            </Link>
            <p className="text-sm text-muted-foreground">Edição: {item.editionLabel}</p>
          </div>
          <button
            type="button"
            onClick={removeItem}
            disabled={busy}
            aria-label={`Remover ${item.name} do carrinho`}
            className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:text-foreground"
          >
            <Trash2 aria-hidden className="size-4" />
          </button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-lg font-bold text-highlight">{displayEth(item.lineTotalEth)}</p>
          <QuantityStepper
            label={`Quantidade de ${item.name}`}
            value={item.quantity}
            max={item.maxQuantity}
            disabled={busy}
            onChange={changeQuantity}
            className="gap-2"
          />
        </div>
      </div>
    </li>
  )
}
