import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import type { EthString } from '@/lib/eth'
import { ethToHundredths, hundredthsToEth, localizedEth } from '../format'

type PriceFilterProps = {
  bounds: { min: EthString; max: EthString }
  selected: { min?: EthString; max?: EthString }
  onApply: (range: { minPrice?: EthString; maxPrice?: EthString }) => void
}

export function PriceFilter({ bounds, selected, onApply }: PriceFilterProps) {
  const headingId = useId()
  const lower = ethToHundredths(bounds.min)
  const upper = ethToHundredths(bounds.max)
  const [range, setRange] = useState<[number, number]>([
    selected.min ? ethToHundredths(selected.min) : lower,
    selected.max ? ethToHundredths(selected.max) : upper,
  ])

  const [from, to] = range
  const disabled = upper <= lower

  function apply() {
    onApply({
      minPrice: from > lower ? hundredthsToEth(from) : undefined,
      maxPrice: to < upper ? hundredthsToEth(to) : undefined,
    })
  }

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h3 id={headingId} className="text-lg leading-4 font-bold">
        Faixa de preço
      </h3>
      <div className="flex flex-col gap-3 pl-3">
        <Slider
          min={lower}
          max={upper}
          step={1}
          minStepsBetweenThumbs={1}
          value={range}
          disabled={disabled}
          onValueChange={(value) => {
            const [nextFrom = lower, nextTo = upper] = value
            setRange([nextFrom, nextTo])
          }}
          thumbLabels={['Preço mínimo', 'Preço máximo']}
          className="h-[21px]"
        />
        <p className="text-[15px] leading-5" aria-live="polite">
          Preço: {localizedEth(hundredthsToEth(from))} - {localizedEth(hundredthsToEth(to))} ETH
        </p>
        <Button type="button" onClick={apply} disabled={disabled} className="h-9 w-fit px-3 text-base">
          Aplicar
        </Button>
      </div>
    </section>
  )
}
