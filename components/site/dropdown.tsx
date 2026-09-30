"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"

/**
 * Анимация появления — CSS (tw-animate-css), а не motion: дропдаун стоит в
 * фильтрах каталога, и ради fade+slide на 150 мс тянуть ~30 КБ gzip
 * motion-рантайма в бандл всех страниц каталога не имеет смысла.
 */
export function Dropdown({
  value,
  options,
  onChange,
  className = "",
  buttonClassName = "",
  valueClassName = "text-ink",
  chevronClassName = "h-5 w-5 text-ink-muted",
  menuClassName = "",
  ariaLabel,
}: {
  value: string
  options: string[]
  onChange: (value: string) => void
  className?: string
  buttonClassName?: string
  valueClassName?: string
  chevronClassName?: string
  menuClassName?: string
  ariaLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-2 outline-none ${buttonClassName}`}
      >
        <span className={`truncate ${valueClassName}`}>{value}</span>
        <ChevronDown
          className={`shrink-0 transition-transform ${chevronClassName} ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <ul
          role="listbox"
          className={`absolute top-[calc(100%+4px)] z-20 max-h-64 min-w-[160px] overflow-auto rounded border border-line bg-white py-1 shadow-lg animate-in fade-in-0 slide-in-from-top-1 duration-150 motion-reduce:animate-none ${menuClassName || "left-0 w-full"}`}
        >
          {options.map((opt) => (
            <li key={opt} role="option" aria-selected={opt === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(opt)
                  setOpen(false)
                }}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-cream ${
                  opt === value ? "font-semibold text-cyan-accent" : "text-ink"
                }`}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
