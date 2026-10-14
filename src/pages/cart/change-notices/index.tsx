import { RefreshCw, X } from 'lucide-react'
import { displayEth } from '@/utils/EthUtils'
import { clearCartNotices, useCartNotices } from '@/stores/cart-notices-store'

export function CartChangeNotices() {
  const notices = useCartNotices()

  return (
    <div aria-live="polite">
      {notices.length > 0 && (
        <section
          aria-label="Alterações no carrinho"
          className="flex items-start justify-between gap-3 rounded-md border border-amber/50 bg-amber/10 p-4 text-sm text-amber"
        >
          <div className="flex gap-3">
            <RefreshCw aria-hidden className="mt-0.5 size-4 shrink-0" />
            <ul className="flex flex-col gap-1">
              {notices.map((notice) => (
                <li key={notice.nftId}>
                  <strong>{notice.name}</strong>:{' '}
                  {notice.previousPriceEth !== notice.priceEth
                    ? `preço atualizado de ${displayEth(notice.previousPriceEth)} para ${displayEth(notice.priceEth)}`
                    : 'disponibilidade atualizada'}
                  {notice.previousPriceEth !== notice.priceEth && notice.availabilityChanged && ' e disponibilidade atualizada'}.
                </li>
              ))}
              <li>O resumo foi recalculado com os valores atuais.</li>
            </ul>
          </div>
          <button
            type="button"
            onClick={clearCartNotices}
            aria-label="Dispensar avisos de alteração"
            className="grid size-7 shrink-0 place-items-center rounded-md hover:bg-amber/20"
          >
            <X aria-hidden className="size-4" />
          </button>
        </section>
      )}
    </div>
  )
}
