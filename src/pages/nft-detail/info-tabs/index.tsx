import type { NftDetail } from '@/contracts/nft'
import { RatingStars } from '@/components/rating-stars'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { networkLabel } from '@/features/catalog/format'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function NftInfoTabs({ nft }: { nft: NftDetail }) {
  return (
    <Tabs defaultValue="detalhes">
      <TabsList aria-label="Informações do NFT">
        <TabsTrigger value="detalhes">Detalhes do NFT</TabsTrigger>
        <TabsTrigger value="avaliacoes">Avaliações de colecionadores ({nft.rating.count})</TabsTrigger>
      </TabsList>

      <TabsContent value="detalhes" className="flex flex-col gap-3 leading-6 text-muted-foreground">
        {nft.story.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <dl className="flex flex-col gap-3">
          <div>
            <dt className="font-bold text-foreground">Rede:</dt>
            <dd>Cunhado na {networkLabel(nft.network)} com procedência imutável e metadados armazenados no IPFS.</dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Contrato:</dt>
            <dd>
              Direitos autorais do criador: {nft.royaltyPercent}% nas vendas secundárias, pagos automaticamente pelos
              mercados compatíveis.
            </dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Direitos autorais:</dt>
            <dd>
              <span title={nft.contractAddress}>{shortAddress(nft.contractAddress)}</span> • Contrato inteligente ERC-721
              verificado.
            </dd>
          </div>
        </dl>
      </TabsContent>

      <TabsContent value="avaliacoes" className="flex flex-col gap-4">
        <p className="flex items-center gap-2 text-foreground">
          <RatingStars value={nft.rating.average} />
          <span>
            {nft.rating.average.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} de 5 · {nft.rating.count} avaliações
          </span>
        </p>
        <ul className="flex flex-col gap-3">
          {nft.reviews.map((review) => (
            <li key={review.id} className="flex flex-col gap-2 bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-foreground">{review.author}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <RatingStars value={review.rating} />
                  <time dateTime={review.createdAt}>{dateFormatter.format(new Date(review.createdAt))}</time>
                </span>
              </div>
              <p className="leading-6 text-muted-foreground">{review.comment}</p>
            </li>
          ))}
        </ul>
      </TabsContent>
    </Tabs>
  )
}
