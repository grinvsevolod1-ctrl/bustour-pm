"use client"

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react"
import { ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { RangePickerInstance } from "./date-range-picker-flatpickr"

type FlatpickrModule = typeof import("./date-range-picker-flatpickr")

/**
 * flatpickr (JS + CSS ≈ 70 КБ raw) грузится отдельным чанком и только после
 * первого намерения пользователя (наведение/фокус/тап по полю). До этого на
 * странице стоит обычный readonly-инпут с текущим значением — SSR-разметка
 * и доступность не меняются. Промис кешируется на модуль: повторные пикеры
 * на странице (таблица дат + фильтр) не грузят чанк дважды.
 */
let flatpickrModule: Promise<FlatpickrModule> | null = null
function loadFlatpickr(): Promise<FlatpickrModule> {
  if (!flatpickrModule) flatpickrModule = import("./date-range-picker-flatpickr")
  return flatpickrModule
}

export type DateRangePickerValue = {
  start: string
  end: string
}

type DateRangePickerProps = {
  value: DateRangePickerValue
  onChange: (value: DateRangePickerValue) => void
  ariaLabel?: string
  placeholder?: string
  className?: string
  minDate?: string
}

function localTodayIso(now = new Date()): string {
  return isoFromDate(now)
}

export function isoFromDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function dateFromIso(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function formatInputDate(iso: string): string {
  const date = dateFromIso(iso)
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`
}

export function formatDateRangePickerLabel(value: DateRangePickerValue, placeholder: string, compact = false): string {
  if (value.start && value.end) {
    const start = formatInputDate(value.start)
    const end = formatInputDate(value.end)
    if (!compact) return `${start} - ${end}`
    if (start.slice(3) === end.slice(3)) return `${start.slice(0, 2)}–${end}`
    if (start.slice(6) === end.slice(6)) return `${start.slice(0, 5)} – ${end}`
    return `${start} - ${end}`
  }
  if (value.start) return formatInputDate(value.start)
  return placeholder
}

export function DateRangePicker({
  value,
  onChange,
  ariaLabel = "Период выезда",
  placeholder = "Любой период",
  className,
  minDate = localTodayIso(),
}: DateRangePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const labelMeasureRef = useRef<HTMLSpanElement>(null)
  const pickerRef = useRef<RangePickerInstance | null>(null)
  const onChangeRef = useRef(onChange)
  const syncingRef = useRef(false)
  // Пользователь кликнул раньше, чем доехал чанк календаря: откроем сразу после создания.
  const pendingOpenRef = useRef(false)
  const [lib, setLib] = useState<FlatpickrModule | null>(null)
  const [open, setOpen] = useState(false)
  const [useCompactLabel, setUseCompactLabel] = useState(false)
  const fullLabel = formatDateRangePickerLabel(value, placeholder)
  const compactLabel = formatDateRangePickerLabel(value, placeholder, true)
  const label = useCompactLabel ? compactLabel : fullLabel
  const hasValue = Boolean(value.start || value.end)
  const selectedDates = useMemo(() => {
    if (!value.start) return []
    return value.end ? [dateFromIso(value.start), dateFromIso(value.end)] : [dateFromIso(value.start)]
  }, [value.end, value.start])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    const input = inputRef.current
    const measure = labelMeasureRef.current
    if (!input || !measure || !value.start || !value.end || fullLabel === compactLabel) {
      setUseCompactLabel(false)
      return
    }

    const updateLabelFormat = () => {
      const horizontalPadding = 24
      setUseCompactLabel(measure.scrollWidth + horizontalPadding > input.clientWidth)
    }

    updateLabelFormat()
    const observer = new ResizeObserver(updateLabelFormat)
    observer.observe(input)
    if (rootRef.current) observer.observe(rootRef.current)
    void document.fonts?.ready.then(updateLabelFormat)
    return () => observer.disconnect()
  }, [compactLabel, fullLabel, value.end, value.start])

  const selectedDatesRef = useRef(selectedDates)
  useEffect(() => {
    selectedDatesRef.current = selectedDates
  }, [selectedDates])

  useEffect(() => {
    if (!lib || !inputRef.current) return
    const picker = lib.createRangePicker(inputRef.current, {
      minDate,
      onChange: (dates) => {
        if (syncingRef.current) return
        const start = dates[0] ? isoFromDate(dates[0]) : ""
        const end = dates[1] ? isoFromDate(dates[1]) : ""
        onChangeRef.current(start ? { start, end } : { start: "", end: "" })
      },
      onOpen: () => setOpen(true),
      onClose: () => setOpen(false),
    })
    // Календарь создан позже первого рендера — сразу отдаём ему текущее значение.
    syncingRef.current = true
    picker.setDate(selectedDatesRef.current, false, "Y-m-d")
    syncingRef.current = false
    pickerRef.current = picker
    if (pendingOpenRef.current) {
      pendingOpenRef.current = false
      picker.open()
    }
    return () => {
      picker.destroy()
      pickerRef.current = null
    }
  }, [lib, minDate])

  useEffect(() => {
    const picker = pickerRef.current
    if (!picker) return
    syncingRef.current = true
    picker.setDate(selectedDates, false, "Y-m-d")
    syncingRef.current = false
  }, [selectedDates])

  // Прогрев чанка по намерению (hover/focus/touchstart): к моменту клика
  // календарь обычно уже загружен и открывается без паузы.
  function preload() {
    if (lib) return
    void loadFlatpickr().then((mod) => setLib((current) => current ?? mod))
  }

  function openPicker() {
    if (pickerRef.current) {
      pickerRef.current.open()
      return
    }
    pendingOpenRef.current = true
    preload()
  }

  function clear(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    pickerRef.current?.clear(false)
    onChange({ start: "", end: "" })
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={cn("date-range-picker relative", className)}>
      <span
        ref={labelMeasureRef}
        aria-hidden
        className="pointer-events-none absolute invisible whitespace-nowrap text-base font-medium"
      >
        {fullLabel}
      </span>
      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onPointerEnter={preload}
        onTouchStart={preload}
        onFocus={preload}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") openPicker()
        }}
        aria-label={ariaLabel}
        aria-expanded={open}
        className="date-range-picker-trigger relative flex h-[52px] cursor-pointer items-center rounded bg-white text-base text-ink focus-visible:ring-2 focus-visible:ring-brand/60"
      >
        <input
          ref={inputRef}
          type="text"
          readOnly
          value={label}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className={cn(
            "min-w-0 flex-1 cursor-pointer bg-transparent px-4 py-3 text-base outline-none",
            hasValue ? "text-ink" : "text-ink-muted",
          )}
        />
        {hasValue ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Очистить даты выезда"
            className="mr-1 rounded-full p-2 text-ink-muted transition-colors hover:bg-cream hover:text-ink"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
        <ChevronDown className={cn("mr-4 h-5 w-5 shrink-0 text-ink-muted transition-transform", open && "rotate-180")} aria-hidden />
      </div>
    </div>
  )
}
