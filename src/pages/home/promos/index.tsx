import { Link, type LinkProps } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Promo = {
  title: string
  description: string
  image: string
  link: LinkProps
}

const PROMOS: Promo[] = [
  {
    title: 'Lançamentos gênesis de edição limitada',
    description: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    image: '/nfts/emerald-480.webp',
    link: { to: '/', search: { tab: 'novos' }, hash: 'catalogo' },
  },
  {
    title: 'Arte digital selecionada e muito mais',
    description: 'Explore novos artistas, coleções verificadas e obras digitais que definem a próxima era.',
    image: '/nfts/baron-480.webp',
    link: { to: '/', search: { collections: ['arte-digital'] }, hash: 'catalogo' },
  },
]

export function PromoSection() {
  return (
    <section aria-label="Promoções" className="page-container grid gap-4 md:grid-cols-2 md:gap-8">
      {PROMOS.map((promo) => (
        <article key={promo.title} className="flex overflow-hidden rounded-lg bg-card">
          <img
            src={promo.image}
            alt=""
            width={480}
            height={480}
            loading="lazy"
            decoding="async"
            className="aspect-square w-2/5 shrink-0 object-cover sm:w-1/2"
          />
          <div className="flex flex-1 flex-col items-end justify-center gap-3 p-4 text-right">
            <h2 className="text-sm font-bold sm:text-base">{promo.title}</h2>
            <p className="text-xs leading-5 text-muted-foreground sm:text-[13px]">{promo.description}</p>
            <Button asChild size="sm" className="gap-1">
              <Link {...promo.link}>
                Explorar
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </Button>
          </div>
        </article>
      ))}
    </section>
  )
}
