import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <section className="page-container flex flex-col items-center gap-6 py-24 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="max-w-md text-sm leading-6 text-muted-foreground">
        O endereço que você acessou não existe ou foi movido.
      </p>
      <Button asChild size="lg">
        <Link to="/">Voltar ao início</Link>
      </Button>
    </section>
  )
}
