import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { cn } from 'cn'
import type { NftSummary } from '@/types/nfts/NftTypes'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { featuredNftsQuery } from '@/hooks/useNfts'

function SlideDots({ slides, active, onSelect }: { slides: NftSummary[]; active: number; onSelect: (index: number) => void }) {
  return (
    <div role="group" aria-label="Destaques" className="flex gap-1.5">
      {slides.map((slide, index) => (
        <button
          key={slide.id}
          type="button"
          aria-label={`Mostrar destaque ${index + 1} de ${slides.length}: ${slide.name}`}
          aria-pressed={index === active}
          onClick={() => onSelect(index)}
          className="grid size-6 place-items-center"
        >
          <span
            className={cn(
              'size-[7px] rounded-full transition-colors',
              index === active ? 'bg-primary' : 'bg-primary/40 hover:bg-primary/70',
            )}
          />
        </button>
      ))}
    </div>
  )
}

export function HomeHero() {
  const { data, isPending, isError } = useQuery(featuredNftsQuery())
  const [active, setActive] = useState(0)
  const slides = data?.hero ?? []
  const current = slides[active] ?? slides[0]
  const secondary = slides[(active + 1) % Math.max(slides.length, 1)]

  return (
    <section aria-label="Boas-vindas" className="page-container lg:pt-8">
      <div className="hidden items-center gap-[110px] pl-10 lg:flex">
        <div className="flex w-[600px] shrink-0 flex-col gap-11">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <p className="text-sm leading-4 font-medium">Bem-vindo à Kurio</p>
              <h1 className="text-[43px] leading-[70px] font-bold">
                SEJA DONO DO FUTURO
                <br />
                DA ARTE DIGITAL
              </h1>
              <p className="max-w-[557px] text-sm leading-6 text-muted-foreground">
                Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie
                artistas e tenha uma parte da cultura da internet.
              </p>
            </div>
            <Button asChild className="w-fit pr-9 pl-7 text-base">
              <Link to="/" hash="catalogo">
                EXPLORAR
              </Link>
            </Button>
          </div>
          {slides.length > 1 && (
            <div className="flex justify-end">
              <SlideDots slides={slides} active={active} onSelect={setActive} />
            </div>
          )}
        </div>
        <div className={cn('size-[450px] shrink-0', isError && 'hidden')}>
          {isPending || !current ? (
            <Skeleton className="size-full rounded-3xl" />
          ) : (
            <Link to="/nfts/$nftId" params={{ nftId: current.id }} className="block overflow-hidden rounded-3xl">
              <img
                key={current.id}
                src={current.image.full}
                alt={current.image.alt}
                width={960}
                height={960}
                fetchPriority="high"
                className="size-[450px] object-cover"
              />
            </Link>
          )}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[30px] bg-linear-to-br from-accent via-secondary to-card p-4 lg:hidden">
        <div className="pointer-events-none absolute -top-16 -right-16 size-62 rounded-full bg-primary/15" />
        <div className="relative flex gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <p className="text-xs leading-4 font-medium">Bem-vindo à Kurio</p>
            <h1 className="text-lg leading-[29px] font-bold">SEJA DONO DA CULTURA DIGITAL</h1>
            <p className="text-xs leading-[18px] text-muted-foreground">
              Descubra NFTs selecionados de criadores do mundo todo.
            </p>
            <Link to="/" hash="catalogo" className="mt-2 flex w-fit items-center gap-2 text-xs font-bold text-highlight">
              EXPLORAR
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
          <div className={cn('relative size-[138px] shrink-0', isError && 'hidden')}>
            {isPending || !current ? (
              <Skeleton className="size-full rounded-2xl" />
            ) : (
              <>
                <img
                  src={current.image.thumb}
                  alt={current.image.alt}
                  width={480}
                  height={480}
                  fetchPriority="high"
                  className="size-[138px] rounded-2xl object-cover"
                />
                {secondary && secondary.id !== current.id && (
                  <img
                    src={secondary.image.thumb}
                    alt=""
                    width={480}
                    height={480}
                    loading="lazy"
                    className="absolute -bottom-2 -left-3 size-[58px] rounded-2xl border-2 border-card object-cover"
                  />
                )}
              </>
            )}
          </div>
        </div>
        {slides.length > 1 && (
          <div className="relative mt-3 flex justify-center">
            <SlideDots slides={slides} active={active} onSelect={setActive} />
          </div>
        )}
      </div>
    </section>
  )
}
