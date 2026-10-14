import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CatalogSearchField } from '@/features/catalog/components/catalog-search-field'

export function HeaderSearch() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  function search(q: string | undefined) {
    setOpen(false)
    void navigate({ to: '/', search: (previous) => ({ ...previous, q, page: undefined }), hash: 'catalogo' })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger aria-label="Buscar" className="text-foreground transition-colors hover:text-highlight">
        <Search aria-hidden className="size-5" />
      </DialogTrigger>
      <DialogContent className="top-24 translate-y-0 border border-border bg-card p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">Buscar no mercado</DialogTitle>
          <DialogDescription>Encontre NFTs pelo nome, coleção ou criador.</DialogDescription>
        </DialogHeader>
        <CatalogSearchField value={undefined} onSearch={search} autoFocus />
      </DialogContent>
    </Dialog>
  )
}
