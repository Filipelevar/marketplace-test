import { useId } from 'react'
import { cn } from 'cn'
import { CATALOG_SORTS, CATALOG_TABS, type CatalogSearch, type CatalogSort } from '@/contracts/nft'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type CatalogToolbarProps = {
  search: CatalogSearch
  onChange: (patch: Partial<CatalogSearch>) => void
}

function isSort(value: string): value is CatalogSort {
  return CATALOG_SORTS.some((sort) => sort.slug === value)
}

export function CatalogToolbar({ search, onChange }: CatalogToolbarProps) {
  const sortLabelId = useId()
  const activeTab = search.tab ?? 'todos'

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div role="group" aria-label="Filtrar por lista" className="flex gap-5 overflow-x-auto">
        {CATALOG_TABS.map((tab) => {
          const active = tab.slug === activeTab
          return (
            <button
              key={tab.slug}
              type="button"
              aria-pressed={active}
              onClick={() => onChange({ tab: tab.slug })}
              className={cn(
                'shrink-0 border-b-2 pb-1 text-[15px] font-medium whitespace-nowrap transition-colors',
                active ? 'border-primary text-highlight' : 'border-transparent text-foreground hover:text-highlight',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-1 text-[15px]">
        <span id={sortLabelId}>Ordenar por:</span>
        <Select
          value={search.sort ?? 'recentes'}
          onValueChange={(value) => {
            if (isSort(value)) onChange({ sort: value })
          }}
        >
          <SelectTrigger aria-labelledby={sortLabelId} className="h-8 border-none bg-transparent px-1 text-[15px] shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {CATALOG_SORTS.map((sort) => (
              <SelectItem key={sort.slug} value={sort.slug}>
                {sort.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
