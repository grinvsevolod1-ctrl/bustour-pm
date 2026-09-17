"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { formatPrice } from "@/lib/format"
import { clamp, type DepartureRange } from "@/lib/tours-listing-utils"
import { DateRangePicker, type DateRangePickerValue } from "@/components/ui/date-range-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"

// Пикеры фильтра каталога, вынесенные из ToursListing: диапазон цены и период выезда.

export function PriceRangePicker({
  value,
  bounds,
  currencyCode,
  currencySymbol,
  onChange,
}: {
  value: [number, number]
  bounds: { min: number; max: number }
  currencyCode: string
  currencySymbol: string
  onChange: (value: [number, number]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isAny = value[0] <= bounds.min && value[1] >= bounds.max
  const label = isAny ? "Любая цена" : `${formatPrice(value[0])} - ${formatPrice(value[1])} ${currencyCode} / чел.`

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [open])

  function setFrom(raw: string) {
    const next = clamp(Number.parseInt(raw || "0", 10), bounds.min, value[1])
    onChange([next, value[1]])
  }

  function setTo(raw: string) {
    const next = clamp(Number.parseInt(raw || "0", 10), value[0], bounds.max)
    onChange([value[0], next])
  }

  return (
    <Popover>
      <div ref={ref} className="flex flex-col gap-1">
        <PopoverTrigger>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Стоимость"
            aria-expanded={open}
            className="flex h-[52px] w-full items-center justify-between rounded bg-white px-4 text-left text-base text-ink"
          >
            <span className={isAny ? "text-ink-muted" : "text-ink"}>{label}</span>
            <ChevronDown className={`h-5 w-5 shrink-0 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
          </button>
        </PopoverTrigger>

        {open ? (
          <PopoverContent className="md:w-[360px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-ink">Диапазон стоимости</span>
                <span className="rounded bg-cream px-2 py-1 text-xs font-bold text-ink">{currencySymbol}</span>
              </div>

              <Slider
                value={value}
                min={bounds.min}
                max={bounds.max}
                step={1}
                minStepsBetweenThumbs={1}
                onValueChange={(next) => onChange([next[0] ?? bounds.min, next[1] ?? bounds.max])}
              />

              <div className="flex items-end gap-2">
                <label className="min-w-0 flex-1 text-xs font-medium text-ink-muted">
                  От
                  <input
                    type="number"
                    inputMode="numeric"
                    value={value[0]}
                    min={bounds.min}
                    max={value[1]}
                    onChange={(e) => setFrom(e.target.value)}
                    className="mt-1 h-11 w-full rounded border border-line px-3 text-base text-ink outline-none focus:border-brand"
                  />
                </label>
                <label className="min-w-0 flex-1 text-xs font-medium text-ink-muted">
                  До
                  <input
                    type="number"
                    inputMode="numeric"
                    value={value[1]}
                    min={value[0]}
                    max={bounds.max}
                    onChange={(e) => setTo(e.target.value)}
                    className="mt-1 h-11 w-full rounded border border-line px-3 text-base text-ink outline-none focus:border-brand"
                  />
                </label>
              </div>
            </div>
          </PopoverContent>
        ) : null}
      </div>
    </Popover>
  )
}

export function BusDeparturePicker({
  value,
  onChange,
}: {
  value: DepartureRange
  onChange: (r: DepartureRange) => void
}) {
  const start = value.kind === "custom" ? value.start : ""
  const end = value.kind === "custom" ? value.end : ""

  function pick(next: DateRangePickerValue) {
    onChange(next.start ? { kind: "custom", start: next.start, end: next.end } : { kind: "any" })
  }

  return (
    <div className="flex min-w-[260px] flex-1 flex-col gap-2">
      <span className="text-base text-white">Период выезда</span>
      <DateRangePicker value={{ start, end }} onChange={pick} />
    </div>
  )
}
