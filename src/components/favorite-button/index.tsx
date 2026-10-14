import { Heart } from 'lucide-react'
import { cn } from 'cn'
import type { NftSummary } from '@/types/nfts/NftTypes'
import { Button } from '@/components/ui/button'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useIsFavorite, useToggleFavorite } from '@/hooks/useFavorites'

type FavoriteButtonProps = {
  nft: NftSummary
  variant: 'icon' | 'button'
  className?: string
}

export function FavoriteButton({ nft, variant, className }: FavoriteButtonProps) {
  const isFavorite = useIsFavorite(nft.id)
  const toggle = useToggleFavorite()
  const requireAuth = useRequireAuth()
  const label = isFavorite ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`

  function onClick() {
    requireAuth('Entre na sua conta para favoritar NFTs.', () => toggle.mutate({ nft, favorite: !isFavorite }))
  }

  const icon = <Heart aria-hidden className={cn('size-5', isFavorite && 'fill-current')} />

  if (variant === 'button') {
    return (
      <Button
        type="button"
        variant="outline"
        aria-pressed={isFavorite}
        aria-label={label}
        onClick={onClick}
        className={cn('font-medium', className)}
      >
        {icon}
        {isFavorite ? 'Favoritado' : 'Favoritar'}
      </Button>
    )
  }

  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'grid size-[37px] place-items-center rounded-full bg-background/80 text-highlight backdrop-blur transition-colors hover:bg-background',
        className,
      )}
    >
      {icon}
    </button>
  )
}
