import { createFileRoute } from '@tanstack/react-router'
import { isComingSoonSection, type ComingSoonSection } from '@/enums/ComingSoonEnums'
import { ComingSoonPage } from '@/pages/core/coming-soon'

export const Route = createFileRoute('/em-breve')({
  validateSearch: (search: Record<string, unknown>): { secao?: ComingSoonSection } =>
    isComingSoonSection(search.secao) ? { secao: search.secao } : {},
  head: () => ({ meta: [{ title: 'Indisponível na demonstração | Kurio' }] }),
  component: ComingSoonPage,
})
