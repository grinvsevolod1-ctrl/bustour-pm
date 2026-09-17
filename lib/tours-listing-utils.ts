import {
  deserializeDepartureRange,
  serializeDepartureRange,
  type DepartureRange,
} from "@/lib/dates-table"

// Чистые хелперы и константы каталога туров, вынесенные из ToursListing,
// чтобы монолитный клиентский компонент не тащил в себя ещё и утилитарную логику.

export const sortOptions = [
  { value: "default", label: "По популярности" },
  { value: "priceAsc", label: "Сначала дешёвые" },
  { value: "priceDesc", label: "Сначала дорогие" },
  { value: "nights", label: "По длительности" },
] as const

export const busSortOptions = [
  { value: "nearest", label: "По ближайшей дате" },
  { value: "popularity", label: "По популярности" },
  { value: "priceAsc", label: "Сначала дешёвые" },
  { value: "priceDesc", label: "Сначала дорогие" },
  { value: "nights", label: "По длительности" },
] as const

export const ALL_DESTINATIONS = "Все направления"
export const ALL_TYPES = "Все типы туров"
export const DATE_FROM_PARAM = "dateFrom"
export const DATE_TO_PARAM = "dateTo"
export const PRICE_FROM_PARAM = "priceFrom"
export const PRICE_TO_PARAM = "priceTo"
export const PRICE_DEBOUNCE_MS = 400
export const PAGE_SIZE = 6

export type SlugMaps = {
  countrySlugById: Record<number, string>
  citySlugById: Record<number, string>
}

export function isIsoDate(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00`)))
}

export function departureRangeFromSearch(params: URLSearchParams): DepartureRange {
  const from = params.get(DATE_FROM_PARAM)
  const to = params.get(DATE_TO_PARAM)
  if (!isIsoDate(from) && !isIsoDate(to)) return { kind: "any" }
  return { kind: "custom", start: isIsoDate(from) ? from : "", end: isIsoDate(to) ? to : "" }
}

export function searchPrice(value: string | null): number | null {
  if (!value) return null
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)))
}

// Реэкспорт для удобства потребителей утилит каталога.
export { deserializeDepartureRange, serializeDepartureRange, type DepartureRange }
