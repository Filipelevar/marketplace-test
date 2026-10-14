import { cn } from 'cn'
import type { NftEdition } from '@/types/nfts/NftTypes'
import { editionLabel } from '@/utils/EditionUtils'

type EditionPickerProps = {
  nftId: string
  editions: NftEdition[]
  selectedId: string | undefined
  onSelect: (editionId: string) => void
}

export function EditionPicker({ nftId, editions, selectedId, onSelect }: EditionPickerProps) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-[15px] leading-4 font-bold">Edição:</legend>
      <div className="flex flex-wrap gap-1.5">
        {editions.map((edition) => {
          const soldOut = edition.available === 0
          const inputId = `${nftId}-edition-${edition.id}`
          return (
            <div key={edition.id}>
              <input
                id={inputId}
                type="radio"
                name={`${nftId}-edition`}
                value={edition.id}
                checked={edition.id === selectedId}
                onChange={() => onSelect(edition.id)}
                className="peer sr-only"
              />
              <label
                htmlFor={inputId}
                className={cn(
                  'flex h-7 cursor-pointer items-center rounded-full border border-border-soft px-2 text-sm text-muted-foreground transition-colors hover:border-primary',
                  'peer-checked:border-primary peer-checked:font-medium peer-checked:text-highlight',
                  'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring',
                  soldOut && 'cursor-not-allowed text-disabled-foreground line-through hover:border-border-soft',
                )}
              >
                {editionLabel(edition)}
                {soldOut && <span className="sr-only"> (esgotada)</span>}
              </label>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}
