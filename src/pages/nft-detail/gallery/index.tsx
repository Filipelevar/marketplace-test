import { useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from 'cn'
import type { NftImage } from '@/types/nfts/NftTypes'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

type NftGalleryProps = {
  name: string
  images: NftImage[]
}

export function NftGallery({ name, images }: NftGalleryProps) {
  const [selected, setSelected] = useState(0)
  const current = images[selected] ?? images[0]
  if (!current) return null

  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row lg:gap-7">
      <ul className="hidden gap-4 lg:flex lg:flex-col" aria-label="Miniaturas">
        {images.map((image, index) => (
          <li key={index}>
            <button
              type="button"
              aria-label={`Ver imagem ${index + 1} de ${images.length}`}
              aria-pressed={index === selected}
              onClick={() => setSelected(index)}
              className={cn(
                'block size-[100px] overflow-hidden rounded-md bg-card p-1 transition-colors',
                index === selected ? 'ring-1 ring-primary' : 'hover:ring-1 hover:ring-border-soft',
              )}
            >
              <img src={image.thumb} alt="" width={480} height={480} loading="lazy" className="size-full rounded-lg object-cover" />
            </button>
          </li>
        ))}
      </ul>

      <div className="relative bg-card p-4 lg:size-[444px] lg:rounded-md">
        <img
          src={current.full}
          alt={current.alt}
          width={960}
          height={960}
          fetchPriority="high"
          className="aspect-square w-full rounded-3xl object-cover"
        />
        <Dialog>
          <DialogTrigger
            aria-label={`Ampliar imagem de ${name}`}
            className="absolute top-6 right-6 grid size-[30px] place-items-center rounded-full bg-background/80 text-foreground transition-colors hover:bg-background"
          >
            <Search aria-hidden className="size-4" />
          </DialogTrigger>
          <DialogContent className="max-w-[min(90vw,48rem)] bg-card p-3 sm:max-w-[min(90vw,48rem)]">
            <DialogTitle className="sr-only">{name}</DialogTitle>
            <DialogDescription className="sr-only">{current.alt}</DialogDescription>
            <img src={current.full} alt={current.alt} width={960} height={960} className="w-full rounded-xl" />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
