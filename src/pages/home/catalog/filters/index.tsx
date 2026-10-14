import { useId } from 'react'
import { Check } from 'lucide-react'
import { cn } from 'cn'
import { COLLECTIONS, NETWORKS, type CatalogSearch, type NftListResponse } from '@/contracts/nft'
import { Skeleton } from '@/components/ui/skeleton'
import { hasActiveFilters } from '../use-catalog-search'
import { PriceFilter } from './price-filter'

type FilterOptionProps = {
  label: string
  count: number | undefined
  selected: boolean
  tone: 'accent' | 'muted'
  onToggle: () => void
}

function FilterOption({ label, count, selected, tone, onToggle }: FilterOptionProps) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onToggle}
        className={cn(
          'flex h-10 w-full items-center justify-between gap-3 rounded-sm px-2 text-[15px] transition-colors hover:bg-secondary',
          tone === 'accent' ? 'text-highlight' : 'text-muted-foreground',
          selected && 'bg-secondary font-bold text-foreground',
        )}
      >
        <span className="flex items-center gap-2">
          <Check aria-hidden className={cn('size-4 shrink-0', !selected && 'invisible')} />
          {label}
        </span>
        <span className={cn(tone === 'accent' && 'font-bold')}>
          {count === undefined ? <span aria-hidden className="inline-block h-4 w-8 rounded-sm bg-muted" /> : `(${count})`}
        </span>
      </button>
    </li>
  )
}

function toggle<T extends string>(list: T[] | undefined, value: T): T[] {
  const current = list ?? []
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
}

type CatalogFiltersProps = {
  search: CatalogSearch
  facets: NftListResponse['facets'] | undefined
  onChange: (patch: Partial<CatalogSearch>) => void
  onClear: () => void
}

export function CatalogFilters({ search, facets, onChange, onClear }: CatalogFiltersProps) {
  const collectionsHeading = useId()
  const networksHeading = useId()
  const countFor = <T extends string>(list: { slug: T; count: number }[] | undefined, slug: T) =>
    list?.find((item) => item.slug === slug)?.count

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby={collectionsHeading} className="flex flex-col gap-3">
        <h3 id={collectionsHeading} className="text-lg leading-4 font-bold">
          Coleções
        </h3>
        <ul className="flex flex-col">
          {COLLECTIONS.map((collection) => (
            <FilterOption
              key={collection.slug}
              label={collection.label}
              count={countFor(facets?.collections, collection.slug)}
              selected={search.collections?.includes(collection.slug) ?? false}
              tone="accent"
              onToggle={() => onChange({ collections: toggle(search.collections, collection.slug) })}
            />
          ))}
        </ul>
      </section>

      {facets ? (
        <PriceFilter
          key={`${search.minPrice ?? ''}-${search.maxPrice ?? ''}`}
          bounds={facets.priceRange}
          selected={{ min: search.minPrice, max: search.maxPrice }}
          onApply={onChange}
        />
      ) : (
        <Skeleton className="h-28 w-full" />
      )}

      <section aria-labelledby={networksHeading} className="flex flex-col gap-3">
        <h3 id={networksHeading} className="text-lg leading-4 font-bold">
          Rede
        </h3>
        <ul className="flex flex-col">
          {NETWORKS.map((network) => (
            <FilterOption
              key={network.slug}
              label={network.label}
              count={countFor(facets?.networks, network.slug)}
              selected={search.networks?.includes(network.slug) ?? false}
              tone="muted"
              onToggle={() => onChange({ networks: toggle(search.networks, network.slug) })}
            />
          ))}
        </ul>
      </section>

      {hasActiveFilters(search) && (
        <button type="button" onClick={onClear} className="w-fit text-sm text-highlight underline-offset-4 hover:underline">
          Limpar filtros
        </button>
      )}
    </div>
  )
}
