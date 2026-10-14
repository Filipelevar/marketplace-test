import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link, useRouter } from '@tanstack/react-router'
import { AlertTriangle, ChevronLeft, SearchX } from 'lucide-react'
import type { NftSummary } from '@/types/nfts/NftTypes'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { nftDetailQuery } from '@/hooks/useNfts'
import { maxQuantityFor, pickEdition } from '@/utils/EditionUtils'
import { NftGallery } from '@/pages/nft-detail/gallery'
import { NftInfoTabs } from '@/pages/nft-detail/info-tabs'
import { MobilePurchaseBar, NftPurchasePanel } from '@/pages/nft-detail/purchase-panel'
import { RelatedNfts } from '@/pages/nft-detail/related-nfts'
import { getApiError, getApiErrorMessage } from '@/utils/ApiErrorUtils'
import { useAddToCartWithFeedback } from '@/hooks/useAddToCartFeedback'
import { FavoriteButton } from '@/components/favorite-button'

const route = getRouteApi('/nfts/$nftId')

export function NftDetailPage() {
  const { nftId } = route.useParams()
  return <NftDetailContent key={nftId} nftId={nftId} />
}

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
          <Link to="/" hash="catalogo" className="hover:text-highlight">
            Mercado
          </Link>
        </li>
      </ol>
    </nav>
  )
}

function MobileImageActions({ nft }: { nft: NftSummary }) {
  const router = useRouter()
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-between p-6 lg:hidden">
      <button
        type="button"
        aria-label="Voltar"
        onClick={() => router.history.back()}
        className="pointer-events-auto grid size-[37px] place-items-center rounded-full bg-background/70 backdrop-blur"
      >
        <ChevronLeft aria-hidden className="size-5" />
      </button>
      <FavoriteButton nft={nft} variant="icon" className="pointer-events-auto" />
    </div>
  )
}

function NftDetailSkeleton() {
  return (
    <div aria-busy className="page-container flex min-h-dvh flex-col gap-8 py-6 lg:flex-row lg:pt-14">
      <span className="sr-only" role="status">
        Carregando NFT
      </span>
      <div className="flex gap-7">
        <div className="hidden flex-col gap-4 lg:flex">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="size-[100px]" />
          ))}
        </div>
        <Skeleton className="aspect-square w-full lg:size-[444px]" />
      </div>
      <div className="flex flex-1 flex-col gap-5">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-7 w-1/2" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

function NftDetailContent({ nftId }: { nftId: string }) {
  const { edition: editionId } = route.useSearch()
  const navigate = route.useNavigate()
  const { data: nft, isPending, isError, error, refetch } = useQuery(nftDetailQuery(nftId))
  const [quantity, setQuantity] = useState(1)
  const cart = useAddToCartWithFeedback()

  if (isPending) return <NftDetailSkeleton />

  if (isError) {
    if (getApiError(error)?.code === 'NOT_FOUND') {
      return (
        <section className="page-container flex flex-col items-center gap-6 py-24 text-center">
          <title>NFT não encontrado | Kurio</title>
          <SearchX aria-hidden className="size-12 text-primary" />
          <h1 className="text-2xl font-bold">NFT não encontrado</h1>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            O NFT que você procura não existe, foi removido ou o endereço está incorreto.
          </p>
          <Button asChild size="lg">
            <Link to="/" hash="catalogo">
              Explorar o mercado
            </Link>
          </Button>
        </section>
      )
    }
    return (
      <section role="alert" className="page-container flex flex-col items-center gap-4 py-24 text-center">
        <AlertTriangle aria-hidden className="size-10 text-coral" />
        <h1 className="text-xl font-bold">Não foi possível carregar este NFT.</h1>
        <p className="text-sm text-muted-foreground">{getApiErrorMessage(error)}</p>
        <Button onClick={() => void refetch()}>Tentar novamente</Button>
      </section>
    )
  }

  const edition = pickEdition(nft.editions, editionId)
  const maxQuantity = maxQuantityFor(edition)
  const safeQuantity = Math.max(1, Math.min(quantity, maxQuantity))

  function addToCart(goToCart: boolean) {
    if (!nft || !edition) return
    cart.add({ nftId: nft.id, editionId: edition.id, quantity: safeQuantity, name: nft.name }, { goToCart })
  }

  function selectEdition(nextEditionId: string) {
    setQuantity(1)
    void navigate({ search: { edition: nextEditionId }, replace: true, resetScroll: false })
  }

  return (
    <div className="flex flex-col gap-16 lg:gap-24">
      <title>{`${nft.name} | Kurio`}</title>
      <div className="page-container flex flex-col gap-3 lg:pt-8">
        <Breadcrumb />
        <div className="flex flex-col lg:flex-row lg:gap-8">
          <div className="relative -mx-4 sm:mx-auto sm:w-full sm:max-w-[520px] lg:mx-0 lg:max-w-none">
            <MobileImageActions nft={nft} />
            <NftGallery name={nft.name} images={nft.gallery} />
          </div>
          <div className="relative -mt-8 rounded-t-[30px] bg-background pt-6 lg:mt-0 lg:flex-1 lg:rounded-none lg:pt-0">
            <NftPurchasePanel
              nft={nft}
              edition={edition}
              quantity={safeQuantity}
              onEditionChange={selectEdition}
              onQuantityChange={setQuantity}
              onBuy={() => addToCart(true)}
              onAddToCart={() => addToCart(false)}
              isAdding={cart.isPending}
            />
          </div>
        </div>
      </div>

      <div className="page-container">
        <NftInfoTabs nft={nft} />
      </div>
      <div className="page-container">
        <RelatedNfts nftId={nft.id} />
      </div>

      <MobilePurchaseBar
        nft={nft}
        edition={edition}
        quantity={safeQuantity}
        onQuantityChange={setQuantity}
        onBuy={() => addToCart(true)}
        onAddToCart={() => addToCart(false)}
        isAdding={cart.isPending}
      />
    </div>
  )
}
