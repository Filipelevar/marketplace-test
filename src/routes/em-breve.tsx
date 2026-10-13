import { createFileRoute, Link } from '@tanstack/react-router'
import { Construction } from 'lucide-react'
import { Button } from '@/components/ui/button'

const SECTIONS = {
  criadores: 'Criadores',
  aprenda: 'Aprenda',
  blog: 'Diário da Cunhagem',
  colecao: 'Minha coleção',
  atividade: 'Atividade',
  estudio: 'Estúdio do criador',
  ofertas: 'Ofertas',
  downloads: 'Arquivos baixados',
  suporte: 'Suporte',
  ajuda: 'Central de ajuda',
  'como-comprar': 'Como comprar NFTs',
  seguranca: 'Carteira e segurança',
  politica: 'Política do mercado',
  denunciar: 'Denunciar item',
  scanner: 'Leitor de QR code',
  'login-social': 'Login social',
} as const

type Section = keyof typeof SECTIONS

function isSection(value: unknown): value is Section {
  return typeof value === 'string' && value in SECTIONS
}

export const Route = createFileRoute('/em-breve')({
  validateSearch: (search: Record<string, unknown>): { secao?: Section } =>
    isSection(search.secao) ? { secao: search.secao } : {},
  head: () => ({ meta: [{ title: 'Indisponível na demonstração | Kurio' }] }),
  component: ComingSoonPage,
})

function ComingSoonPage() {
  const { secao } = Route.useSearch()
  const title = secao ? SECTIONS[secao] : 'Esta seção'

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
