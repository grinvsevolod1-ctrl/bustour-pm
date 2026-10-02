/**
 * Справочник Tourvisor (страны и курорты → ID) и подбор ID по названию.
 *
 * Поисковые модули Tourvisor принимают страну/курорт страницы через атрибуты
 * хоста (`tv-country`, `tv-resorts`, `tv-countries`). Источник ID:
 *   1) поле «ID в Tourvisor» у страны/курорта в админке (приоритет);
 *   2) иначе — подбор по названию из снимка lib/tourvisor-directory.json
 *      (обновляется `npm run tourvisor:sync`).
 *
 * Модуль чистый и серверный: JSON-снимок (~40 КБ) не должен попадать в
 * клиентские бандлы — импортируйте его только из RSC/серверного кода.
 */
import directory from "@/lib/tourvisor-directory.json"

export type TourvisorCountry = { id: number; name: string }
export type TourvisorResort = { id: number; countryId: number; parentId: number; name: string }

type Snapshot = {
  fetchedAt: string
  countries: [number, string][]
  resorts: [number, number, number, string][]
}

// JSON выводится как (string|number)[][]; форма кортежей гарантируется скриптом синхронизации.
const snapshot = directory as unknown as Snapshot

/** Названия на сайте, отличающиеся от написания Tourvisor. */
const GEO_ALIASES: Record<string, string> = {
  "морокко": "марокко",
  "объединенные арабские эмираты": "оаэ",
  "доминиканская республика": "доминикана",
  "анталия": "анталья",
  "алания": "аланья",
  "макади": "макади бей",
  "сахл хашиш": "сахль хашиш",
}

/** Маркетинговые префиксы страниц горящих туров: «Горящая Хургада», «Горящие туры в Турцию». */
const MARKETING_PREFIX = /^(горящ\S*\s+)?(туры\s+(в|на)\s+|отдых\s+(в|на)\s+)?/u

/**
 * Нормализация для сравнения: регистр, ё/е, префиксы «Горящая…», а дефис и
 * пробел считаются одним разделителем («Шарм-эль-Шейх» = «Шарм эль Шейх»).
 */
export function normalizeGeoName(value: string): string {
  const base = value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(MARKETING_PREFIX, "")
    .replace(/[^a-zа-я0-9]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
  return GEO_ALIASES[base] ?? base
}

export const TOURVISOR_DIRECTORY_FETCHED_AT = snapshot.fetchedAt

export const tourvisorCountries: readonly TourvisorCountry[] = snapshot.countries.map(([id, name]) => ({ id, name }))

export const tourvisorResorts: readonly TourvisorResort[] = snapshot.resorts.map(([id, countryId, parentId, name]) => ({
  id,
  countryId,
  parentId,
  name,
}))

const countryByName = new Map<string, number>()
for (const c of tourvisorCountries) {
  const key = normalizeGeoName(c.name)
  if (!countryByName.has(key)) countryByName.set(key, c.id)
}

const resortsByCountry = new Map<number, TourvisorResort[]>()
for (const r of tourvisorResorts) {
  const list = resortsByCountry.get(r.countryId)
  if (list) list.push(r)
  else resortsByCountry.set(r.countryId, [r])
}

export function findTourvisorCountryId(name: string): number | undefined {
  const key = normalizeGeoName(name)
  return key ? countryByName.get(key) : undefined
}

/** Курорты страны (верхний уровень первыми — так их сортирует снимок). */
export function listTourvisorResorts(countryId: number): readonly TourvisorResort[] {
  return resortsByCountry.get(countryId) ?? []
}

/**
 * ID курорта по названию внутри страны. У Tourvisor встречаются одноимённые
 * пары «регион / подрайон» (Албена 126 и 2035) — берём верхний уровень.
 */
export function findTourvisorResortId(countryId: number, name: string): number | undefined {
  const key = normalizeGeoName(name)
  if (!key) return undefined
  const matches = listTourvisorResorts(countryId).filter((r) => normalizeGeoName(r.name) === key)
  if (!matches.length) return undefined
  return (matches.find((r) => r.parentId === 0) ?? matches[0]).id
}

export function tourvisorCountryName(id: number): string | undefined {
  return tourvisorCountries.find((c) => c.id === id)?.name
}

export function tourvisorResortName(id: number): string | undefined {
  return tourvisorResorts.find((r) => r.id === id)?.name
}

/**
 * Итоговый ID страны для виджета: ручное значение из админки или подбор по
 * названию. `null`/0 в поле = «не задано» → подбор.
 */
export function resolveTourvisorCountryId(country: { name: string; tourvisorId?: number | null }): number | undefined {
  if (country.tourvisorId && country.tourvisorId > 0) return country.tourvisorId
  return findTourvisorCountryId(country.name)
}

/** Итоговый ID курорта для виджета (ручное значение или подбор внутри страны). */
export function resolveTourvisorResortId(
  city: { name: string; tourvisorId?: number | null },
  countryId: number | undefined,
): number | undefined {
  if (city.tourvisorId && city.tourvisorId > 0) return city.tourvisorId
  if (!countryId) return undefined
  return findTourvisorResortId(countryId, city.name)
}

export type TourvisorWidgetGeo = { countryId?: number; cityId?: number }

/**
 * Пропсы направления для AviaTourSearchWidget / HotToursWidget на странице
 * страны или курорта. Если страна не определилась, а курорт задан вручную —
 * страну берём из справочника по курорту, иначе модуль не найдёт курорт.
 */
export function tourvisorWidgetGeo(
  country: { name: string; tourvisorId?: number | null } | undefined,
  city?: { name: string; tourvisorId?: number | null },
): TourvisorWidgetGeo {
  let countryId = country ? resolveTourvisorCountryId(country) : undefined
  const cityId = city ? resolveTourvisorResortId(city, countryId) : undefined
  if (!countryId && cityId) countryId = tourvisorResorts.find((r) => r.id === cityId)?.countryId
  return {
    ...(countryId ? { countryId } : {}),
    ...(cityId ? { cityId } : {}),
  }
}
