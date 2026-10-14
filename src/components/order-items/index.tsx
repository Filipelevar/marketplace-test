import type { QuoteItem } from '@/contracts/checkout'
import { displayEth } from '@/lib/eth'

export function OrderItems({ items, caption }: { items: QuoteItem[]; caption: string }) {
  return (
    <table className="w-full border-separate border-spacing-y-2 text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="text-left font-bold">
          <th scope="col" className="border-b border-primary/30 pb-2">
            NFTs
          </th>
          <th scope="col" className="border-b border-primary/30 px-3 pb-2 text-center">
            Edições
          </th>
          <th scope="col" className="border-b border-primary/30 pb-2 text-right">
            Subtotal
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <th scope="row" className="py-1 text-left font-normal">
              <span className="flex items-center gap-3">
                <img src={item.image.thumb} alt="" width={480} height={480} loading="lazy" className="size-[52px] shrink-0 rounded-md object-cover" />
                <span className="min-w-0">
                  <span className="block truncate font-bold">{item.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    ID do token: {item.tokenId} · Edição {item.editionLabel}
                  </span>
                </span>
              </span>
            </th>
            <td className="px-3 text-center whitespace-nowrap text-muted-foreground">(x {item.quantity})</td>
            <td className="text-right font-bold whitespace-nowrap text-highlight">{displayEth(item.lineTotalEth)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
