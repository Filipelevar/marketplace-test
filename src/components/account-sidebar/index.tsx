import type { ComponentType, SVGProps } from 'react'
import { Link, useLocation, useNavigate, type LinkProps } from '@tanstack/react-router'
import { Download, Heart, LifeBuoy, LogOut, ShoppingCart, Tag, UserRound, Wallet } from 'lucide-react'
import { cn } from 'cn'
import { useLogout } from '@/hooks/useAuth'

type NavItem = {
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  link: LinkProps
  match?: string
}

const ITEMS: NavItem[] = [
  { label: 'Dados do perfil', icon: UserRound, link: { to: '/perfil' }, match: '/perfil' },
  { label: 'Carteiras', icon: Wallet, link: { to: '/carteiras' }, match: '/carteiras' },
  { label: 'Atividade', icon: ShoppingCart, link: { to: '/em-breve', search: { secao: 'atividade' } } },
  { label: 'Lista de interesse', icon: Heart, link: { to: '/favoritos' }, match: '/favoritos' },
  { label: 'Ofertas', icon: Tag, link: { to: '/em-breve', search: { secao: 'ofertas' } } },
  { label: 'Arquivos baixados', icon: Download, link: { to: '/em-breve', search: { secao: 'downloads' } } },
  { label: 'Suporte', icon: LifeBuoy, link: { to: '/em-breve', search: { secao: 'suporte' } } },
]

export function AccountNav() {
  const { pathname } = useLocation()
  const logout = useLogout()
  const navigate = useNavigate()

  function signOut() {
    logout.mutate(undefined, { onSettled: () => void navigate({ to: '/' }) })
  }

  return (
    <nav aria-label="Minha conta" className="lg:w-[310px] lg:shrink-0 lg:self-start lg:bg-card lg:pt-5">
      <h2 className="mb-2 hidden px-2.5 text-lg font-bold lg:block">Meu perfil</h2>
      <ul className="relative flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0">
        {ITEMS.map(({ label, icon: Icon, link, match }) => {
          const active = match !== undefined && pathname.startsWith(match)
          return (
            <li key={label} className="shrink-0">
              <Link
                {...link}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-full border border-border px-4 py-2 text-[15px] whitespace-nowrap text-highlight transition-colors hover:bg-secondary lg:rounded-none lg:border-0 lg:border-l-4 lg:border-transparent lg:px-4 lg:py-3',
                  active && 'border-primary bg-secondary font-bold lg:border-primary',
                )}
              >
                <Icon aria-hidden className="size-5" />
                {label}
              </Link>
            </li>
          )
        })}
        <li className="shrink-0 lg:border-t lg:border-border">
          <button
            type="button"
            onClick={signOut}
            disabled={logout.isPending}
            className="flex w-full items-center gap-3 rounded-full border border-border px-4 py-2 text-[15px] font-bold whitespace-nowrap text-highlight transition-colors hover:bg-secondary lg:rounded-none lg:border-0 lg:px-4 lg:py-3"
          >
            <LogOut aria-hidden className="size-5" />
            Sair
          </button>
        </li>
      </ul>
    </nav>
  )
}
