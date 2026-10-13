import { ShoppingCart } from 'lucide-react'
import type { NftDetail, NftEdition } from '@/contracts/nft'
import { QuantityStepper } from '@/components/quantity-stepper'
import { RatingStars } from '@/components/rating-stars'
import { Button } from '@/components/ui/button'
import { displayEth } from '@/lib/eth'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import { maxQuantityFor } from '../editions'
import { EditionPicker } from './edition-picker'
import { ShareLinks } from './share-links'

type NftPurchasePanelProps = {
  nft: NftDetail
  edition: NftEdition | undefined
  quantity: number
  onEditionChange: (editionId: string) => void
  onQuantityChange: (quantity: number) => void
  onBuy: () => void
  onAddToCart: () => void
  isAdding: boolean
}

export function AvailabilityNotice({ nft, edition }: { nft: NftDetail; edition: NftEdition | undefined }) {
  if (nft.available === 0) {
    return (
      <p role="status" className="text-sm font-bold text-coral">
        Este NFT está esgotado em todas as edições.
      </p>
    )
  }
  if (edition && edition.available === 0) {
    return (
      <p role="status" className="text-sm font-bold text-coral">
        A edição {edition.label} está esgotada. Escolha outra edição.
      </p>
    )
  }
  if (edition && edition.available <= 3) {
    return (
      <p role="status" className="text-sm text-amber">
        Restam apenas {edition.available} {edition.available === 1 ? 'unidade' : 'unidades'} desta edição.
      </p>
    )
  }
  return null
}

export function NftPurchasePanel({
  nft,
  edition,
  quantity,
  onEditionChange,
  onQuantityChange,
  onBuy,
  isAdding,
}: NftPurchasePanelProps) {
  const maxQuantity = maxQuantityFor(edition)
  const soldOut = maxQuantity === 0

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 border-b border-primary/30 pb-3">
        <h1 className="text-2xl leading-9 font-bold sm:text-[28px]">{nft.name}</h1>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[22px] leading-4 font-bold text-highlight">
            <span className="sr-only">Preço: </span>
            {displayEth(nft.priceEth)}
          </p>
          <p className="flex items-center gap-1 text-[15px]">
            <RatingStars value={nft.rating.average} />
            {nft.rating.count} avaliações de colecionadores
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-[15px] leading-4 font-bold">Sobre este NFT:</h2>
        <p className="text-sm leading-6 text-muted-foreground">{nft.description}</p>
      </div>

      <EditionPicker nftId={nft.id} editions={nft.editions} selectedId={edition?.id} onSelect={onEditionChange} />
      <AvailabilityNotice nft={nft} edition={edition} />

      <div className="hidden flex-wrap items-center justify-between gap-4 lg:flex">
        <QuantityStepper
          label="Quantidade"
          value={soldOut ? 0 : quantity}
          min={soldOut ? 0 : 1}
          max={maxQuantity}
          disabled={soldOut}
          onChange={onQuantityChange}
        />
        <div className="flex gap-2">
          <Button onClick={onBuy} disabled={soldOut || isAdding} className="w-[130px]">
            {isAdding ? 'ADICIONANDO...' : 'COMPRAR'}
          </Button>
          <FavoriteButton nft={nft} variant="button" className="w-[130px]" />
        </div>
      </div>

      <dl className="flex flex-col gap-3 text-[15px] text-subtle">
        <div className="flex gap-1">
          <dt>ID do token:</dt>
          <dd>{nft.tokenId}</dd>
        </div>
        <div className="flex gap-1">
          <dt>Coleção:</dt>
          <dd>{nft.collectionName}</dd>
        </div>
        <div className="flex gap-1">
          <dt>Atributos:</dt>
          <dd>{nft.attributes.join(', ')}</dd>
        </div>
      </dl>
      <ShareLinks name={nft.name} />
    </div>
  )
}

export function MobilePurchaseBar({
  nft,
  edition,
  quantity,
  onQuantityChange,
  onBuy,
  onAddToCart,
  isAdding,
}: Pick<NftPurchasePanelProps, 'nft' | 'edition' | 'quantity' | 'onQuantityChange' | 'onBuy' | 'onAddToCart' | 'isAdding'>) {
  const maxQuantity = maxQuantityFor(edition)
  const soldOut = maxQuantity === 0

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col gap-4 rounded-t-[30px] bg-card px-6 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgb(0_0_0/0.35)] lg:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-bold" aria-hidden>
            Qtd.
          </span>
          <QuantityStepper
            label="Quantidade"
            value={soldOut ? 0 : quantity}
            min={soldOut ? 0 : 1}
            max={maxQuantity}
            disabled={soldOut}
            onChange={onQuantityChange}
          />
        </div>
        <p className="text-xl font-bold text-highlight">{displayEth(nft.priceEth)}</p>
      </div>
      <div className="flex gap-3">
        <Button
          size="lg"
          onClick={onBuy}
          disabled={soldOut || isAdding}
          className="h-[60px] flex-1 rounded-[30px] bg-linear-to-r from-primary-light to-primary-dark"
        >
          Comprar NFT
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={onAddToCart}
          disabled={soldOut || isAdding}
          aria-label="Adicionar ao carrinho"
          className="size-[60px] rounded-full bg-secondary"
        >
          <ShoppingCart aria-hidden />
        </Button>
      </div>
    </div>
  )
}
