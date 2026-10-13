import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { FavoritesResponse } from '@/contracts/cart'
import type { NftSummary } from '@/contracts/nft'
import { getApiErrorMessage } from '@/lib/api-error'
import { http } from '@/lib/http'
import { useSession } from '@/features/auth/api'
import { favoriteKeys } from './keys'

export { favoriteKeys }

export function favoritesQuery(userId: string) {
  return queryOptions({
    queryKey: favoriteKeys.user(userId),
    queryFn: async ({ signal }) => (await http.get<FavoritesResponse>('/favorites', { signal })).data,
  })
}

export function useFavorites() {
  const session = useSession()
  const userId = session.user?.id ?? ''
  return useQuery({ ...favoritesQuery(userId), enabled: session.status === 'authenticated' })
}

export function useIsFavorite(nftId: string) {
  const { data } = useFavorites()
  return data?.items.some((item) => item.id === nftId) ?? false
}

type ToggleFavoriteInput = { nft: NftSummary; favorite: boolean }

export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const session = useSession()
  const key = favoriteKeys.user(session.user?.id ?? '')

  return useMutation({
    mutationFn: async ({ nft, favorite }: ToggleFavoriteInput) => {
      const url = `/favorites/${encodeURIComponent(nft.id)}`
      if (favorite) await http.put(url)
      else await http.delete(url)
    },
    onMutate: async ({ nft, favorite }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<FavoritesResponse>(key)
      queryClient.setQueryData<FavoritesResponse>(key, (current) => {
        const items = (current?.items ?? []).filter((item) => item.id !== nft.id)
        return { items: favorite ? [nft, ...items] : items }
      })
      return { previous }
    },
    onError: (error, { favorite }, context) => {
      queryClient.setQueryData(key, context?.previous)
      toast.error(favorite ? 'Não foi possível favoritar.' : 'Não foi possível remover dos favoritos.', {
        description: getApiErrorMessage(error),
      })
    },
    onSuccess: (_data, { nft, favorite }) => {
      toast.success(favorite ? `${nft.name} adicionado à lista de interesse.` : `${nft.name} removido da lista de interesse.`)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}
