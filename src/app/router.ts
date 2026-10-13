import type { QueryClient } from '@tanstack/react-query'
import { createRouter, parseSearchWith, stringifySearchWith } from '@tanstack/react-router'
import { routeTree } from '@/routeTree.gen'

export type RouterContext = {
  queryClient: QueryClient
}

function stringifySearchValue(value: unknown) {
  return Array.isArray(value) ? value.join(',') : JSON.stringify(value)
}

export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
    parseSearch: parseSearchWith(JSON.parse),
    stringifySearch: stringifySearchWith(stringifySearchValue),
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }

  interface StaticDataRouteOption {
    mobileBottomBar?: 'purchase'
  }
}
