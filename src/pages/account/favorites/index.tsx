import { Link } from '@tanstack/react-router'
import { AlertTriangle, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NftCard, NftCardSkeleton } from '@/components/nft-card'
import { useFavorites } from '@/hooks/useFavorites'
import { getApiErrorMessage } from '@/utils/ApiErrorUtils'

export function FavoritesPage() {
  const { data, isPending, isError, error, refetch } = useFavorites()

  return (
    <section aria-labelledby="favoritos-titulo" className="flex flex-col gap-8">
      <h1 id="favoritos-titulo" className="text-lg font-bold">
        Lista de interesse
      </h1>
      {isPending ? (
        <ul aria-hidden className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-8">
          {Array.from({ length: 4 }, (_, index) => (
            <li key={index}>
              <NftCardSkeleton />
            </li>
          ))}
        </ul>
      ) : isError ? (
        <div role="alert" className="flex flex-col items-center gap-4 bg-card px-6 py-16 text-center">
          <AlertTriangle aria-hidden className="size-10 text-coral" />
          <p className="font-bold">Não foi possível carregar seus favoritos.</p>
          <p className="text-sm text-muted-foreground">{getApiErrorMessage(error)}</p>
          <Button onClick={() => void refetch()}>Tentar novamente</Button>
        </div>
      ) : data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 bg-card px-6 py-16 text-center">
          <Heart aria-hidden className="size-10 text-primary" />
          <p className="font-bold">Você ainda não favoritou nenhum NFT.</p>
          <Button asChild>
            <Link to="/" hash="catalogo">
              Explorar o mercado
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:gap-8">
          {data.items.map((nft) => (
            <li key={nft.id}>
              <NftCard nft={nft} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
