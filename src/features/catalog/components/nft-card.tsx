import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import type { NftSummary } from '@/contracts/nft'
import { Skeleton } from '@/components/ui/skeleton'
import { displayEth } from '@/lib/eth'

type NftCardProps = {
  nft: NftSummary
  priority?: boolean
}

export function NftCard({ nft, priority = false }: NftCardProps) {
  const soldOut = nft.available === 0

  return (
    <article className="group flex flex-col gap-3">
      <Link
        to="/nfts/$nftId"
        params={{ nftId: nft.id }}
        className="flex flex-col gap-3 rounded-2xl focus-visible:outline-offset-4 sm:rounded-none"
      >
        <div className="relative rounded-2xl bg-card px-1 pt-7 pb-6 transition-colors group-hover:bg-secondary sm:rounded-none">
          <img
            src={nft.image.thumb}
            alt={nft.image.alt}
            width={480}
            height={480}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className={cn(
              'aspect-square w-full rounded-[15px] object-cover transition-transform duration-300 group-hover:scale-[1.02]',
              soldOut && 'opacity-60 grayscale-[40%]',
            )}
          />
          {nft.rarity === 'raro' && (
            <span className="absolute top-0 left-1 bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
              RARO
            </span>
          )}
          {soldOut && (
            <span className="absolute top-0 right-1 bg-secondary px-3 py-1 text-sm font-bold text-foreground">
              ESGOTADO
            </span>
          )}
        </div>
        <span className="truncate text-base leading-4">{nft.name}</span>
      </Link>
      <p className="flex flex-wrap items-baseline gap-x-3 text-lg leading-4">
        <span className="font-bold text-highlight">
          <span className="sr-only">Preço: </span>
          {displayEth(nft.priceEth)}
        </span>
        {nft.compareAtPriceEth && (
          <s className="text-subtle">
            <span className="sr-only">Preço anterior: </span>
            {displayEth(nft.compareAtPriceEth)}
          </s>
        )}
      </p>
    </article>
  )
}

export function NftCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl bg-card px-1 pt-7 pb-6 sm:rounded-none">
        <Skeleton className="aspect-square w-full rounded-[15px]" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  )
}
