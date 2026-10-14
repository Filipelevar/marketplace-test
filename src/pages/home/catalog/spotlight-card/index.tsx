import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { displayEth } from '@/utils/EthUtils'
import { featuredNftsQuery } from '@/hooks/useNfts'

export function SpotlightCard() {
  const { data, isPending, isError } = useQuery(featuredNftsQuery())

  if (isError) return null

  return (
    <section
      aria-labelledby="destaque-titulo"
      className="flex flex-col gap-4 bg-linear-to-b from-accent/70 to-transparent pt-6"
    >
      <div className="flex flex-col gap-4 px-5">
        <h2 id="destaque-titulo" className="text-2xl font-bold text-highlight">
          NFT EM DESTAQUE
        </h2>
        <p className="text-[22px] leading-4 font-bold">OFERTA LIMITADA</p>
      </div>
      {isPending ? (
        <Skeleton className="aspect-[310/368] w-full rounded-[22px]" />
      ) : (
        <Link
          to="/nfts/$nftId"
          params={{ nftId: data.spotlight.id }}
          className="group relative block overflow-hidden rounded-[22px]"
        >
          <img
            src={data.spotlight.image.full}
            alt={data.spotlight.image.alt}
            width={960}
            height={960}
            loading="lazy"
            decoding="async"
            className="aspect-[310/368] w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-linear-to-t from-background/90 to-transparent p-4 pt-10">
            <span className="font-bold">{data.spotlight.name}</span>
            <span className="font-bold text-highlight">{displayEth(data.spotlight.priceEth)}</span>
          </span>
        </Link>
      )}
    </section>
  )
}
