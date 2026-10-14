import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { nftListQuery } from '@/hooks/useNfts'
import { useCatalogSearch } from '@/hooks/useCatalogSearch'
import { CatalogFilters } from '@/pages/home/catalog/filters'
import { CatalogSearchField } from '@/components/inputs/search-field'

export function CatalogMobileBar() {
  const { search, updateFilters, clearFilters } = useCatalogSearch()
  const { data } = useQuery(nftListQuery(search))
  const activeFilterCount =
    (search.collections?.length ?? 0) + (search.networks?.length ?? 0) + (search.minPrice || search.maxPrice ? 1 : 0)

  return (
    <div className="page-container flex gap-3 pt-6 lg:hidden">
      <CatalogSearchField value={search.q} onSearch={(q) => updateFilters({ q })} />
      <Sheet>
        <SheetTrigger asChild>
          <Button
            size="icon"
            aria-label={activeFilterCount ? `Filtros (${activeFilterCount} ativos)` : 'Filtros'}
            className="relative size-[45px] shrink-0 rounded-[14px] bg-linear-to-br from-primary-light to-primary-dark"
          >
            <SlidersHorizontal aria-hidden />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-foreground text-xs text-background">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto bg-card p-5">
          <SheetHeader className="p-0">
            <SheetTitle className="text-xl">Filtros</SheetTitle>
            <SheetDescription>Combine coleções, faixa de preço e rede.</SheetDescription>
          </SheetHeader>
          <CatalogFilters search={search} facets={data?.facets} onChange={updateFilters} onClear={clearFilters} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
