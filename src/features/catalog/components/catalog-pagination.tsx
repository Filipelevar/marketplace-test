import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from 'cn'

const WINDOW = 5

function pageWindow(page: number, totalPages: number) {
  const start = Math.max(1, Math.min(page - Math.floor(WINDOW / 2), totalPages - WINDOW + 1))
  const end = Math.min(totalPages, start + WINDOW - 1)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

const itemClass =
  'grid size-[35px] place-items-center rounded-[4px] border border-border text-lg transition-colors hover:border-primary hover:text-highlight'

export function CatalogPagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null

  const pageLink = (target: number) => ({
    to: '/' as const,
    search: (previous: Record<string, unknown>) => ({ ...previous, page: target > 1 ? target : undefined }),
    hash: 'catalogo',
  })

  return (
    <nav aria-label="Paginação do catálogo" className="flex justify-end">
      <ul className="flex gap-2">
        {page > 1 && (
          <li>
            <Link {...pageLink(page - 1)} aria-label="Página anterior" className={itemClass}>
              <ChevronLeft aria-hidden className="size-[18px]" />
            </Link>
          </li>
        )}
        {pageWindow(page, totalPages).map((target) => (
          <li key={target}>
            <Link
              {...pageLink(target)}
              aria-label={`Página ${target}`}
              aria-current={target === page ? 'page' : undefined}
              className={cn(itemClass, target === page && 'border-primary bg-primary font-bold text-primary-foreground hover:text-primary-foreground')}
            >
              {target}
            </Link>
          </li>
        ))}
        {page < totalPages && (
          <li>
            <Link {...pageLink(page + 1)} aria-label="Próxima página" className={itemClass}>
              <ChevronRight aria-hidden className="size-[18px]" />
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
