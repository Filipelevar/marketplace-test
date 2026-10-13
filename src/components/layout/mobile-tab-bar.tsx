import type { ComponentType, SVGProps } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { Heart, House, ScanLine, ShoppingCart, User } from 'lucide-react'
import { cn } from 'cn'

type TabProps = {
  to: '/' | '/favoritos' | '/carrinho' | '/perfil'
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  active: boolean
}

function Tab({ to, label, icon: Icon, active }: TabProps) {
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon aria-hidden className="size-5" />
      {label}
    </Link>
  )
}

export function MobileTabBar() {
  const { pathname } = useLocation()

  return (
    <nav
      aria-label="Navegação inferior"
      className="fixed inset-x-0 bottom-0 z-40 rounded-t-[2rem] bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgb(0_0_0/0.35)] lg:hidden"
    >
      <div className="mx-auto flex h-[72px] max-w-md items-stretch px-4">
        <Tab to="/" label="Início" icon={House} active={pathname === '/'} />
        <Tab to="/favoritos" label="Favoritos" icon={Heart} active={pathname.startsWith('/favoritos')} />
        <div className="relative flex flex-1 justify-center">
          <Link
            to="/em-breve"
            search={{ secao: 'scanner' }}
            aria-label="Leitor de QR code"
            className="absolute -top-7 grid size-16 place-items-center rounded-full bg-linear-to-br from-primary-light to-primary-dark text-primary-foreground ring-8 ring-background"
          >
            <ScanLine aria-hidden className="size-7" />
          </Link>
        </div>
        <Tab to="/carrinho" label="Carrinho" icon={ShoppingCart} active={pathname.startsWith('/carrinho')} />
        <Tab to="/perfil" label="Perfil" icon={User} active={pathname.startsWith('/perfil')} />
      </div>
    </nav>
  )
}
