import { getRouteApi } from '@tanstack/react-router'
import type { CatalogSearch } from '@/types/nfts/NftTypes'

const homeRoute = getRouteApi('/')

function clean(search: CatalogSearch): CatalogSearch {
  return {
    q: search.q || undefined,
    collections: search.collections?.length ? search.collections : undefined,
    networks: search.networks?.length ? search.networks : undefined,
    tab: search.tab === 'todos' ? undefined : search.tab,
    sort: search.sort === 'recentes' ? undefined : search.sort,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    page: search.page && search.page > 1 ? search.page : undefined,
  }
}

export function useCatalogSearch() {
  const search = homeRoute.useSearch()
  const navigate = homeRoute.useNavigate()

  function updateFilters(patch: Partial<CatalogSearch>) {
    void navigate({
      search: (previous) => clean({ ...previous, ...patch, page: undefined }),
      resetScroll: false,
    })
  }

  function clearFilters() {
    void navigate({ search: (previous) => clean({ sort: previous.sort, tab: previous.tab }), resetScroll: false })
  }

  return { search, updateFilters, clearFilters }
}

export function hasActiveFilters(search: CatalogSearch) {
  return Boolean(search.q || search.collections?.length || search.networks?.length || search.minPrice || search.maxPrice)
}
