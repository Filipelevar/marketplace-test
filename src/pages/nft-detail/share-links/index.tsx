import { Mail } from 'lucide-react'
import { LinkedinIcon, TwitterIcon } from '@/components/icons/social-icons'

export function ShareLinks({ name }: { name: string }) {
  const url = typeof window === 'undefined' ? '' : window.location.href.split('?')[0] ?? ''
  const text = `Conheça ${name} na Kurio`
  const links = [
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      icon: <LinkedinIcon className="size-4" />,
    },
    {
      label: 'e-mail',
      href: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
      icon: <Mail aria-hidden className="size-[18px]" />,
    },
    {
      label: 'Twitter',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      icon: <TwitterIcon className="size-4" />,
    },
  ]

  return (
    <div className="flex items-center gap-2">
      <span className="text-[15px] font-bold">Compartilhar este NFT:</span>
      <ul className="flex items-center gap-2">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Compartilhar por ${link.label} (abre em nova aba)`}
              className="grid size-7 place-items-center text-foreground transition-colors hover:text-highlight"
            >
              {link.icon}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
