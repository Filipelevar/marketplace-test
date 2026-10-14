import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, SearchX } from 'lucide-react'
import { cn } from 'cn'
import { CATALOG_PAGE_SIZE } from '@/types/nfts/NftTypes'
import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/utils/ApiErrorUtils'
import { nftListQuery } from '@/hooks/useNfts'
import { hasActiveFilters, useCatalogSearch } from '@/hooks/useCatalogSearch'
import { CatalogFilters } from '@/pages/home/catalog/filters'
import { CatalogPagination } from '@/components/pagination'
import { CatalogToolbar } from '@/pages/home/catalog/toolbar'
import { NftCard, NftCardSkeleton } from '@/components/nft-card'
import { SpotlightCard } from '@/pages/home/catalog/spotlight-card'

export function CatalogSection() {
  const { search, updateFilters, clearFilters } = useCatalogSearch()
  const query = useQuery(nftListQuery(search))
  const { data, isPending, isError, isFetching, isPlaceholderData, error, refetch } = query

  return (
    <section id="catalogo" aria-labelledby="catalogo-titulo" className="page-container scroll-mt-6">
      <h2 id="catalogo-titulo" className="sr-only">
        Catálogo de NFTs
      </h2>

      <div className="flex gap-12">
        <aside aria-label="Filtros do catálogo" className="hidden w-[310px] shrink-0 flex-col gap-6 lg:flex">
          <div className="bg-card p-5">
            <CatalogFilters search={search} facets={data?.facets} onChange={updateFilters} onClear={clearFilters} />
          </div>
          <SpotlightCard />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-8">
          {search.q && (
            <p className="hidden items-center gap-3 text-sm lg:flex">
              Resultados para <strong className="text-highlight">“{search.q}”</strong>
              <button
                type="button"
                onClick={() => updateFilters({ q: undefined })}
                className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Limpar busca
              </button>
            </p>
          )}
          <CatalogToolbar search={search} onChange={updateFilters} />

          <p aria-live="polite" className="sr-only">
            {isPending ? 'Carregando NFTs' : data ? `${data.total} NFTs encontrados` : ''}
          </p>

          {isPending ? (
            <ul aria-hidden className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-[72px]">
              {Array.from({ length: CATALOG_PAGE_SIZE }, (_, index) => (
                <li key={index}>
                  <NftCardSkeleton />
                </li>
              ))}
            </ul>
          ) : isError && !data ? (
            <div role="alert" className="flex flex-col items-center gap-4 bg-card px-6 py-16 text-center">
              <AlertTriangle aria-hidden className="size-10 text-coral" />
              <p className="text-lg font-bold">Não foi possível carregar o catálogo.</p>
              <p className="text-sm text-muted-foreground">{getApiErrorMessage(error)}</p>
              <Button onClick={() => void refetch()}>Tentar novamente</Button>
            </div>
          ) : data && data.items.length === 0 ? (
            <div className="flex flex-col items-center gap-4 bg-card px-6 py-16 text-center">
              <SearchX aria-hidden className="size-10 text-primary" />
              <p className="text-lg font-bold">Nenhum NFT encontrado</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {hasActiveFilters(search)
                  ? 'Ajuste a busca ou remova alguns filtros para ver mais resultados.'
                  : 'Ainda não há NFTs listados no mercado.'}
              </p>
              {hasActiveFilters(search) && <Button onClick={clearFilters}>Limpar filtros</Button>}
            </div>
          ) : data ? (
            <>
              {isError && (
                <div role="alert" className="flex flex-wrap items-center justify-between gap-3 bg-card px-4 py-3 text-sm">
                  <span>Não foi possível atualizar o catálogo. {getApiErrorMessage(error)}</span>
                  <Button size="sm" onClick={() => void refetch()}>
                    Tentar novamente
                  </Button>
                </div>
              )}
              <ul
                aria-busy={isFetching}
                className={cn(
                  'grid grid-cols-2 gap-x-4 gap-y-6 transition-opacity sm:grid-cols-3 sm:gap-x-8 sm:gap-y-[72px] max-sm:[&>li:nth-child(even)]:translate-y-8',
                  isPlaceholderData && 'opacity-60',
                )}
              >
                {data.items.map((nft, index) => (
                  <li key={nft.id}>
                    <NftCard nft={nft} priority={index < 3} />
                  </li>
                ))}
              </ul>
              <CatalogPagination page={data.page} totalPages={data.totalPages} />
            </>
          ) : null}
        </div>
      </div>
    </section>
  )
}
