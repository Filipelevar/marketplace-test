import { Link } from '@tanstack/react-router'
import { Search, ShoppingCart } from 'lucide-react'
import type { NftSummary } from '@/contracts/nft'
import { useAddToCartWithFeedback } from '@/features/cart/use-add-to-cart-feedback'
import { FavoriteButton } from '@/features/favorites/favorite-button'

const QUICK_ADD_EDITION_ID = 'aberta'

const actionClass =
  'grid size-[35px] place-items-center rounded-md bg-background/90 text-foreground transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50'

export function NftCardActions({ nft }: { nft: NftSummary }) {
  const cart = useAddToCartWithFeedback()
  const soldOut = nft.available === 0

  return (
    <>
      <div className="absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 gap-2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 sm:flex">
        <button
          type="button"
          aria-label={`Adicionar ${nft.name} ao carrinho`}
          disabled={soldOut || cart.isPending}
          onClick={() => cart.add({ nftId: nft.id, editionId: QUICK_ADD_EDITION_ID, quantity: 1, name: nft.name })}
          className={actionClass}
        >
          <ShoppingCart aria-hidden className="size-5" />
        </button>
        <FavoriteButton nft={nft} variant="icon" className="size-[35px] rounded-md" />
        <Link to="/nfts/$nftId" params={{ nftId: nft.id }} aria-label={`Ver detalhes de ${nft.name}`} className={actionClass}>
          <Search aria-hidden className="size-5" />
        </Link>
      </div>
      <FavoriteButton nft={nft} variant="icon" className="absolute top-3 right-3 z-10 size-8 sm:hidden" />
    </>
  )
}
