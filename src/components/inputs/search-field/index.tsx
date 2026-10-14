import { useId, useState, type FormEvent } from 'react'
import { Search } from 'lucide-react'

type CatalogSearchFieldProps = {
  value: string | undefined
  onSearch: (query: string | undefined) => void
  autoFocus?: boolean
}

export function CatalogSearchField({ value, onSearch, autoFocus }: CatalogSearchFieldProps) {
  const inputId = useId()
  const [text, setText] = useState(value ?? '')
  const [syncedValue, setSyncedValue] = useState(value)

  if (value !== syncedValue) {
    setSyncedValue(value)
    setText(value ?? '')
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearch(text.trim() || undefined)
  }

  return (
    <form role="search" onSubmit={submit} className="relative flex-1">
      <label htmlFor={inputId} className="sr-only">
        Buscar NFTs, coleções ou criadores
      </label>
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-subtle" />
      <input
        id={inputId}
        type="search"
        value={text}
        autoFocus={autoFocus}
        onChange={(event) => setText(event.target.value)}
        placeholder="Explorar coleções"
        enterKeyHint="search"
        className="h-[45px] w-full rounded-[10px] bg-card pr-3 pl-10 text-[15px] text-foreground placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-ring"
      />
    </form>
  )
}
