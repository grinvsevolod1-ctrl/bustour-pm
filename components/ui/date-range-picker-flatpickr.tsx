"use client"

import flatpickr from "flatpickr"
import type { Instance } from "flatpickr/dist/types/instance"
import { Russian } from "flatpickr/dist/l10n/ru"
import "@/styles/flatpickr-theme.css"

export type RangePickerInstance = Instance

export type RangePickerOptions = {
  minDate: string
  onChange: (dates: Date[]) => void
  onOpen: () => void
  onClose: () => void
}

/**
 * Единственная точка, где импортируется flatpickr (JS ~53 КБ + CSS ~15 КБ).
 * Модуль подгружается через dynamic import из DateRangePicker только при
 * первом намерении пользователя открыть календарь, поэтому ни главная, ни
 * страницы туров, ни каталог не платят за него в критическом пути загрузки.
 */
export function createRangePicker(input: HTMLInputElement, options: RangePickerOptions): RangePickerInstance {
  return flatpickr(input, {
    mode: "range",
    dateFormat: "d.m.Y",
    ariaDateFormat: "d.m.Y",
    minDate: options.minDate,
    disableMobile: true,
    showMonths: 1,
    monthSelectorType: "dropdown",
    locale: { ...Russian, rangeSeparator: " - ", firstDayOfWeek: 1 },
    onChange: options.onChange,
    onOpen: options.onOpen,
    onClose: options.onClose,
  })
}
