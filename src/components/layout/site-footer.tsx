import type { ComponentType, SVGProps } from 'react'
import { Link, type LinkProps } from '@tanstack/react-router'
import { BellRing, Palette, ShieldCheck } from 'lucide-react'
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon,
  YoutubeIcon,
} from '@/components/icons/social-icons'
import { cn } from 'cn'
import { NewsletterForm } from '@/features/newsletter/newsletter-form'
import { useMobileBottomBar } from './use-mobile-bottom-bar'

const SOCIAL_LINKS = [
  { label: 'Facebook', href: 'https://www.facebook.com', icon: FacebookIcon },
  { label: 'Instagram', href: 'https://www.instagram.com', icon: InstagramIcon },
  { label: 'Twitter', href: 'https://twitter.com', icon: TwitterIcon },
  { label: 'LinkedIn', href: 'https://www.linkedin.com', icon: LinkedinIcon },
  { label: 'YouTube', href: 'https://www.youtube.com', icon: YoutubeIcon },
]

type Feature = {
  title: string
  description: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

const FEATURES: Feature[] = [
  {
    title: 'Segurança da carteira',
    description: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
    icon: ShieldCheck,
  },
  {
    title: 'Criadores em destaque',
    description: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
    icon: Palette,
  },
  {
    title: 'Alertas de lançamentos',
    description: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
    icon: BellRing,
  },
]

type FooterLink = { label: string; link: LinkProps }

const LINK_GROUPS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Meu perfil',
    links: [
      { label: 'Meu perfil', link: { to: '/perfil' } },
      { label: 'Minha coleção', link: { to: '/em-breve', search: { secao: 'colecao' } } },
      { label: 'Atividade', link: { to: '/em-breve', search: { secao: 'atividade' } } },
      { label: 'Estúdio do criador', link: { to: '/em-breve', search: { secao: 'estudio' } } },
      { label: 'Lista de interesse', link: { to: '/favoritos' } },
    ],
  },
  {
    title: 'Central de ajuda',
    links: [
      { label: 'Central de ajuda', link: { to: '/em-breve', search: { secao: 'ajuda' } } },
      { label: 'Como comprar NFTs', link: { to: '/em-breve', search: { secao: 'como-comprar' } } },
      { label: 'Carteira e segurança', link: { to: '/em-breve', search: { secao: 'seguranca' } } },
      { label: 'Política do mercado', link: { to: '/em-breve', search: { secao: 'politica' } } },
      { label: 'Denunciar item', link: { to: '/em-breve', search: { secao: 'denunciar' } } },
    ],
  },
  {
    title: 'Coleções',
    links: [
      { label: 'Arte digital', link: { to: '/', search: { collections: ['arte-digital'] }, hash: 'catalogo' } },
      { label: 'Fotografia', link: { to: '/', search: { collections: ['fotografia'] }, hash: 'catalogo' } },
      { label: 'Música', link: { to: '/', search: { collections: ['musica'] }, hash: 'catalogo' } },
      { label: 'Arte 3D', link: { to: '/', search: { collections: ['arte-3d'] }, hash: 'catalogo' } },
      { label: 'Utilidade', link: { to: '/', search: { collections: ['utilidade'] }, hash: 'catalogo' } },
    ],
  },
]

export function SiteFooter() {
  const bottomBar = useMobileBottomBar()

  return (
    <footer className={cn('page-container mt-24 lg:pb-6', bottomBar === 'purchase' ? 'pb-48' : 'pb-28')}>
      <section aria-labelledby="footer-highlights" className="bg-card p-6 sm:p-8">
        <h2 id="footer-highlights" className="sr-only">
          Destaques da Kurio
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.35fr] lg:gap-0">
          {FEATURES.map(({ title, description, icon: Icon }) => (
            <div key={title} className="flex flex-col gap-3 lg:border-r lg:border-primary lg:px-4">
              <span className="grid size-[74px] place-items-center rounded-full bg-primary text-primary-foreground">
                <Icon aria-hidden className="size-8" />
              </span>
              <h3 className="text-[17px] font-bold">{title}</h3>
              <p className="max-w-[204px] text-sm leading-[22px] text-muted-foreground">{description}</p>
            </div>
          ))}
          <div className="flex flex-col gap-4 lg:px-4">
            <h3 className="text-lg leading-4 font-bold">Antecipe-se ao próximo lançamento</h3>
            <NewsletterForm />
            <p className="text-[13px] leading-[22px] text-muted-foreground">
              Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 bg-accent p-6 text-sm leading-[22px] sm:grid-cols-2 sm:p-8 lg:grid-cols-4">
        <span className="text-sm font-bold tracking-[0.1em]">KURIO</span>
        <p>Feito para colecionadores, criadores e cultura</p>
        <a href="mailto:contato@email.com" className="hover:text-highlight">
          contato@email.com
        </a>
        <a href="tel:+551140028922" className="hover:text-highlight">
          +55 11 4002 8922
        </a>
      </div>

      <div className="grid gap-8 bg-card p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-4">
        {LINK_GROUPS.map((group) => (
          <nav key={group.title} aria-label={group.title} className="flex flex-col gap-2">
            <h2 className="text-lg font-bold">{group.title}</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {group.links.map(({ label, link }) => (
                <li key={label}>
                  <Link {...link} className="hover:text-highlight">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold">Redes sociais</h2>
            <ul className="flex gap-2.5">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Kurio no ${label} (abre em nova aba)`}
                    className="grid size-[31px] place-items-center rounded-[3px] border border-primary text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <Icon className="h-4 w-auto" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold">Carteiras compatíveis</h2>
            <p className="w-fit rounded-sm border border-primary/40 bg-accent px-2 py-1 text-[9px] font-bold tracking-wide text-highlight">
              METAMASK · WALLETCONNECT · COINBASE
            </p>
          </div>
        </div>
      </div>

      <p className="py-3 text-center text-sm leading-[30px]">© 2026 Kurio. Propriedade digital para todos.</p>
    </footer>
  )
}
