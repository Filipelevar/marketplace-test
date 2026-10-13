import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cn } from 'cn'
import { relatedNftsQuery } from '@/features/catalog/api'
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/nft-card'

export function RelatedNfts({ nftId }: { nftId: string }) {
  const { data, isPending, isError } = useQuery(relatedNftsQuery(nftId))
  const scroller = useRef<HTMLUListElement>(null)
  const [page, setPage] = useState(0)
  const [pageCount, setPageCount] = useState(1)

  if (isError || (data && data.length === 0)) return null

  function measure() {
    const element = scroller.current
    if (!element) return
    const pages = Math.max(1, Math.ceil(element.scrollWidth / element.clientWidth - 0.05))
    setPageCount(pages)
    setPage(Math.min(pages - 1, Math.round(element.scrollLeft / element.clientWidth)))
  }

  function goTo(target: number) {
    const element = scroller.current
    if (!element) return
    element.scrollTo({ left: target * element.clientWidth, behavior: 'smooth' })
  }

  return (
    <section aria-labelledby="relacionados-titulo" className="flex flex-col gap-8">
      <h2 id="relacionados-titulo" className="border-b border-primary/30 pb-3 text-[17px] leading-4 font-bold text-highlight">
        Mais desta coleção
      </h2>
      <ul
        ref={(element) => {
          scroller.current = element
          if (element) requestAnimationFrame(measure)
        }}
        onScroll={measure}
        className="relative grid snap-x snap-mandatory auto-cols-[calc((100%-1rem)/2)] grid-flow-col gap-4 overflow-x-auto pb-2 [scrollbar-width:none] sm:auto-cols-[calc((100%-3.5rem)/3)] sm:gap-7 lg:auto-cols-[calc((100%-7rem)/5)]"
      >
        {isPending
          ? Array.from({ length: 5 }, (_, index) => (
              <li key={index} className="snap-start">
                <NftCardSkeleton />
              </li>
            ))
          : data.map((nft) => (
              <li key={nft.id} className="snap-start">
                <NftCard nft={nft} />
              </li>
            ))}
      </ul>
      {pageCount > 1 && (
        <div role="group" aria-label="Páginas de NFTs relacionados" className="flex justify-center gap-2">
          {Array.from({ length: pageCount }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Ir para a página ${index + 1} de ${pageCount}`}
              aria-pressed={index === page}
              onClick={() => goTo(index)}
              className="grid size-6 place-items-center"
            >
              <span
                className={cn(
                  'size-3 rounded-full border border-primary transition-colors',
                  index === page ? 'bg-primary' : 'bg-transparent',
                )}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
