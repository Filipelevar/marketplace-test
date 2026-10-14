import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { FavoritesResponse } from '@/types/cart/CartTypes'
import type { NftSummary } from '@/types/nfts/NftTypes'
import { addFavorite, getFavorites, removeFavorite } from '@/services/favorites/FavoriteServices'
import { getApiErrorMessage } from '@/utils/ApiErrorUtils'
import { useSession } from '@/hooks/useAuth'
import { favoriteKeys } from '@/hooks/queryKeys'

export function favoritesQuery(userId: string) {
  return queryOptions({
    queryKey: favoriteKeys.user(userId),
    queryFn: ({ signal }) => getFavorites(signal),
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
    mutationFn: ({ nft, favorite }: ToggleFavoriteInput) => (favorite ? addFavorite(nft.id) : removeFavorite(nft.id)),
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
