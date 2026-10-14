import { getRouteApi, Link } from '@tanstack/react-router'
import { Construction } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { COMING_SOON_SECTIONS } from '@/enums/ComingSoonEnums'

const route = getRouteApi('/em-breve')

export function ComingSoonPage() {
  const { secao } = route.useSearch()
  const title = secao ? COMING_SOON_SECTIONS[secao] : 'Esta seção'

  return (
    <section className="page-container flex flex-col items-center gap-6 py-24 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-card text-primary">
        <Construction aria-hidden className="size-8" />
      </span>
      <div className="flex max-w-xl flex-col gap-3">
        <h1 className="text-2xl font-bold">{title} não faz parte desta demonstração</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          O protótipo da Kurio cobre descoberta, compra e conta do colecionador. Conteúdos editoriais, suporte e
          integrações externas aparecem no layout, mas não estão disponíveis aqui.
        </p>
      </div>
      <Button asChild size="lg">
        <Link to="/">Voltar ao início</Link>
      </Button>
    </section>
  )
}
