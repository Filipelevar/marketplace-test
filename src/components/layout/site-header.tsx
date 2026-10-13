import type { ReactNode } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { LogIn, ShoppingCart } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { HeaderSearch } from './header-search'

const MARKET_PATHS = ['/nfts', '/carrinho', '/pagamento']

function NavItem({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        'flex h-[45px] flex-col justify-start border-b-[3px] text-base leading-[21px] transition-colors',
        active ? 'border-primary font-bold text-highlight' : 'border-transparent text-foreground hover:text-highlight',
      )}
    >
      {children}
    </span>
  )
}

export function SiteHeader() {
  const { pathname, search } = useLocation()
  const section = 'secao' in search ? search.secao : undefined
  const isHome = pathname === '/'
  const isMarket = MARKET_PATHS.some((path) => pathname.startsWith(path))

  return (
    <header className="page-container hidden pt-6 lg:block">
      <div className="flex h-[45px] items-start justify-between border-b border-primary/30">
        <Link to="/" className="flex h-[34px] w-40 items-center text-sm font-bold tracking-[0.1em]" aria-label="Kurio, início">
          KURIO
        </Link>

        <nav aria-label="Principal">
          <ul className="flex gap-10">
            <li>
              <Link to="/" aria-current={isHome ? 'page' : undefined}>
                <NavItem active={isHome}>Início</NavItem>
              </Link>
            </li>
            <li>
              <Link to="/" hash="catalogo" aria-current={isMarket ? 'page' : undefined}>
                <NavItem active={isMarket}>Mercado</NavItem>
              </Link>
            </li>
            <li>
              <Link to="/em-breve" search={{ secao: 'criadores' }}>
                <NavItem active={section === 'criadores'}>Criadores</NavItem>
              </Link>
            </li>
            <li>
              <Link to="/em-breve" search={{ secao: 'aprenda' }}>
                <NavItem active={section === 'aprenda'}>Aprenda</NavItem>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex h-[35px] w-[207px] items-center justify-end gap-7">
          <HeaderSearch />
          <Link to="/carrinho" aria-label="Carrinho" className="relative text-foreground hover:text-highlight">
            <ShoppingCart aria-hidden className="size-6" />
          </Link>
          <Button asChild size="sm" className="h-[35px] gap-1 px-2.5 text-base font-medium">
            <Link to="/entrar">
              <LogIn aria-hidden />
              Entrar
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
