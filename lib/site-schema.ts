/** Shared schema.org builders for public site JSON-LD. */

import { getCanonicalOrigin } from "@/lib/canonical-origin"
import { parseSocialLinks } from "@/lib/social-links"
import { serializeJsonLd, stripFaqHtml } from "@/lib/faq-schema"
import type { SiteSettings } from "@/lib/types"

export { serializeJsonLd }

export function organizationId(origin: string): string {
  return `${origin.replace(/\/$/, "")}/#organization`
}

export function absoluteUrl(origin: string, pathOrUrl: string | undefined | null): string | undefined {
  const raw = String(pathOrUrl || "").trim()
  if (!raw) return undefined
  if (/^https?:\/\//i.test(raw)) return raw
  const base = origin.replace(/\/$/, "")
  return `${base}${raw.startsWith("/") ? raw : `/${raw}`}`
}

/** Parse `site.hours` like `10:00–18:00` → opens/closes (fallback weekdays 10–18). */
export function parseSiteOpenClose(settings: SiteSettings): { opens: string; closes: string } {
  const raw = String(settings["site.hours"] || "10:00–18:00")
  const m = raw.match(/(\d{1,2}:\d{2})\s*[–\-—]\s*(\d{1,2}:\d{2})/)
  return {
    opens: m?.[1] ?? "10:00",
    closes: m?.[2] ?? "18:00",
  }
}

export type OpeningHoursSpecification = {
  "@type": "OpeningHoursSpecification"
  dayOfWeek: string[]
  opens: string
  closes: string
}

export function buildWeekdayOpeningHours(settings: SiteSettings): OpeningHoursSpecification[] {
  const { opens, closes } = parseSiteOpenClose(settings)
  return [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: padTime(opens),
      closes: padTime(closes),
    },
  ]
}

// Порядок дней недели schema.org — нужен для разворота диапазонов «пн–пт».
const WEEK_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const

// Русские сокращения/полные названия → канон schema.org.
const RU_DAY_TO_SCHEMA: Record<string, (typeof WEEK_ORDER)[number]> = {
  пн: "Monday",
  понедельник: "Monday",
  вт: "Tuesday",
  вторник: "Tuesday",
  ср: "Wednesday",
  среда: "Wednesday",
  чт: "Thursday",
  четверг: "Thursday",
  пт: "Friday",
  пятница: "Friday",
  сб: "Saturday",
  суббота: "Saturday",
  вс: "Sunday",
  воскресенье: "Sunday",
}

/** Нормализуем время к HH:MM (schema.org требует ведущий ноль: «9:00» → «09:00»). */
function padTime(time: string): string {
  const m = time.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return time
  return `${m[1].padStart(2, "0")}:${m[2]}`
}

function ruDayToSchema(token: string): (typeof WEEK_ORDER)[number] | null {
  return RU_DAY_TO_SCHEMA[token.trim().toLowerCase().replace(/\.$/, "")] ?? null
}

/** Развернуть диапазон дней «Monday..Friday» в массив. */
function expandDayRange(from: string, to: string): (typeof WEEK_ORDER)[number][] {
  const start = WEEK_ORDER.indexOf(from as (typeof WEEK_ORDER)[number])
  const end = WEEK_ORDER.indexOf(to as (typeof WEEK_ORDER)[number])
  if (start < 0 || end < 0) return []
  // Поддержка «переноса через неделю» (напр. «пт–вт») на всякий случай.
  const out: (typeof WEEK_ORDER)[number][] = []
  for (let i = start; ; i = (i + 1) % 7) {
    out.push(WEEK_ORDER[i])
    if (i === end) break
    if (out.length > 7) break
  }
  return out
}

/**
 * Разобрать CMS-поле `site.hoursFull` («Полный режим работы», по пункту на строку)
 * в OpeningHoursSpecification. Поддерживает:
 *   «пн–пт: 10:00–18:00», «сб 10:00-15:00», «ежедневно 9:00–21:00»,
 *   «пн, ср, пт: 10:00–18:00». Строки без времени («сб и вс — выходной») пропускаются.
 * Возвращает [] если ничего осмысленного не распознано (тогда используется фолбэк).
 */
export function parseHoursFull(raw?: string): OpeningHoursSpecification[] {
  const text = String(raw || "").trim()
  if (!text) return []

  const specs: OpeningHoursSpecification[] = []

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Время обязательно — иначе это заметка про выходной, а не рабочий день.
    const time = trimmed.match(/(\d{1,2}:\d{2})\s*[–\-—]\s*(\d{1,2}:\d{2})/)
    if (!time) continue
    const opens = padTime(time[1])
    const closes = padTime(time[2])

    // Часть строки до времени — там перечислены дни.
    const daysPart = trimmed.slice(0, time.index ?? 0).toLowerCase()

    let days: (typeof WEEK_ORDER)[number][] = []
    if (/ежеднев|кажд\w*\s+день|пн\s*[–\-—]\s*вс|24\/7|без\s+выходн/.test(daysPart)) {
      days = [...WEEK_ORDER]
    } else {
      // Диапазон «пн–пт».
      const range = daysPart.match(/([а-яё]{2,})\s*[–\-—]\s*([а-яё]{2,})/i)
      if (range) {
        const from = ruDayToSchema(range[1])
        const to = ruDayToSchema(range[2])
        if (from && to) days = expandDayRange(from, to)
      }
      // Список «пн, ср, пт» (или единичный день).
      if (!days.length) {
        const tokens = daysPart.match(/[а-яё]{2,}/gi) || []
        const mapped = tokens.map(ruDayToSchema).filter((d): d is (typeof WEEK_ORDER)[number] => d != null)
        days = Array.from(new Set(mapped))
      }
    }

    if (!days.length) continue
    specs.push({ "@type": "OpeningHoursSpecification", dayOfWeek: days, opens, closes })
  }

  return specs
}

/** Пн–Пт спека напрямую из `site.hours` (поле шапки). null, если не распознано. */
function parseSiteHoursSpec(settings: SiteSettings): OpeningHoursSpecification | null {
  const raw = String(settings["site.hours"] || "").trim()
  const m = raw.match(/(\d{1,2}:\d{2})\s*[–\-—]\s*(\d{1,2}:\d{2})/)
  if (!m) return null
  return {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: padTime(m[1]),
    closes: padTime(m[2]),
  }
}

/**
 * Итоговые часы работы для schema.org.
 *
 * Авторитетный источник для будних дней — `site.hours` (поле «Часы работы»),
 * то же значение, что показывается в шапке сайта: именно его правит админ,
 * поэтому схема обязана совпадать с шапкой. `site.hoursFull` («Полный режим
 * работы») используется лишь чтобы ДОБАВИТЬ нестандартные дни (сб/вс), которых
 * короткое поле выразить не может — его будние строки НЕ перекрывают `site.hours`.
 * Так исключается расхождение «в шапке одно, в schema.org другое».
 */
export function buildOpeningHours(settings: SiteSettings): OpeningHoursSpecification[] {
  const weekdaySpec = parseSiteHoursSpec(settings)
  const full = parseHoursFull(settings["site.hoursFull"])

  // Полный режим не задан — только короткие часы (или дефолтный фолбэк Пн–Пт).
  if (!full.length) {
    return weekdaySpec ? [weekdaySpec] : buildWeekdayOpeningHours(settings)
  }
  // Короткие часы не заданы/не распознаны — доверяем полному режиму как есть.
  if (!weekdaySpec) {
    return full
  }
  // Оба заданы: будни ← site.hours (шапка), доп. дни (сб/вс) ← полный режим.
  const WEEKDAYS = new Set(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])
  const extraDays = full
    .map((spec) => ({ ...spec, dayOfWeek: spec.dayOfWeek.filter((d) => !WEEKDAYS.has(d)) }))
    .filter((spec) => spec.dayOfWeek.length > 0)
  return [weekdaySpec, ...extraDays]
}

export type TravelAgencyJsonLd = {
  "@context": "https://schema.org"
  "@type": "TravelAgency"
  "@id": string
  name: string
  url: string
  description?: string
  telephone?: string
  email?: string
  logo?: string
  sameAs?: string[]
  address?: {
    "@type": "PostalAddress"
    streetAddress?: string
    addressLocality?: string
    addressCountry?: string
  }
  openingHoursSpecification: OpeningHoursSpecification[]
}

export function buildTravelAgencyJsonLd(
  settings: SiteSettings,
  opts?: { phone?: string; email?: string },
): TravelAgencyJsonLd {
  // 🔐 Trust boundary: canonical origin ALWAYS comes from env, NEVER from CMS site.url
  const origin = getCanonicalOrigin()
  const sameAs = parseSocialLinks(settings)
    .map((s) => s.url.trim())
    .filter((u) => /^https?:\/\//i.test(u))

  const name = stripFaqHtml(settings["site.brand"] || "БасТур") || "БасТур"
  const phone = opts?.phone?.trim() || undefined
  const email = opts?.email?.trim() || undefined
  const street = settings["site.address"]?.trim() || undefined

  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": organizationId(origin),
    name,
    url: origin,
    description:
      "Туристическая компания: автобусные туры, авиатуры, горящие туры и аренда автобусов.",
    ...(phone ? { telephone: phone } : {}),
    ...(email ? { email } : {}),
    logo: absoluteUrl(origin, "/figma/logomark.svg"),
    ...(sameAs.length ? { sameAs } : {}),
    ...(street
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: street,
            addressLocality: "Минск",
            addressCountry: "BY",
          },
        }
      : {}),
    openingHoursSpecification: buildOpeningHours(settings),
  }
}

export type WebSiteJsonLd = {
  "@context": "https://schema.org"
  "@type": "WebSite"
  name: string
  url: string
  publisher: { "@id": string }
}

/**
 * WebSite only — no SearchAction.
 * Avia/hot search is Tourvisor embed (not a first-party `?q=` URL Google can crawl).
 */
export function buildWebSiteJsonLd(settings: SiteSettings): WebSiteJsonLd {
  const origin = getCanonicalOrigin()
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: stripFaqHtml(settings["site.brand"] || "БасТур") || "БасТур",
    url: origin,
    publisher: { "@id": organizationId(origin) },
  }
}

export type ArticleJsonLd = {
  "@context": "https://schema.org"
  "@type": "Article"
  headline: string
  description?: string
  image?: string
  datePublished?: string
  dateModified?: string
  author: { "@type": "Organization"; "@id": string; name: string }
  publisher: { "@type": "Organization"; "@id": string; name: string; logo?: string }
  mainEntityOfPage: string
  url: string
}

export function buildArticleJsonLd(input: {
  origin: string
  brandName: string
  title: string
  description?: string
  image?: string
  date?: string
  urlPath: string
}): ArticleJsonLd | null {
  const headline = stripFaqHtml(input.title)
  if (!headline) return null
  const origin = input.origin.replace(/\/$/, "")
  const url = absoluteUrl(origin, input.urlPath)
  if (!url) return null
  const orgId = organizationId(origin)
  const brand = stripFaqHtml(input.brandName) || "БасТур"
  const date = input.date?.trim().slice(0, 10)
  const image = absoluteUrl(origin, input.image)
  const description = input.description ? stripFaqHtml(input.description) : undefined

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
    ...(date ? { datePublished: date, dateModified: date } : {}),
    author: { "@type": "Organization", "@id": orgId, name: brand },
    publisher: {
      "@type": "Organization",
      "@id": orgId,
      name: brand,
      logo: absoluteUrl(origin, "/figma/logomark.svg"),
    },
    mainEntityOfPage: url,
    url,
  }
}

export type ItemListJsonLd = {
  "@context": "https://schema.org"
  "@type": "ItemList"
  name: string
  itemListElement: {
    "@type": "ListItem"
    position: number
    name: string
    description?: string
  }[]
}

/**
 * Разметка программы тура как ItemList (по дням). Google понимает ItemList
 * для карусели/структурированного превью. Заголовок дня → name, описание дня
 * (без HTML) → description. Пустые дни пропускаем; если ничего не осталось —
 * не эмитим разметку вовсе.
 */
export function buildTourProgramJsonLd(input: {
  tourTitle: string
  items: { day: string; text: string; dayStart?: number; dayEnd?: number }[]
}): ItemListJsonLd | null {
  const title = stripFaqHtml(input.tourTitle) || "Программа тура"
  const elements = input.items
    .map((p, i) => {
      const name = stripFaqHtml(p.day) || `День ${i + 1}`
      const description = p.text ? stripFaqHtml(p.text) : undefined
      return { name, description, position: i + 1 }
    })
    .filter((e) => e.name)
  if (!elements.length) return null

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Программа тура «${title}»`,
    itemListElement: elements.map((e) => ({
      "@type": "ListItem" as const,
      position: e.position,
      name: e.name,
      ...(e.description ? { description: e.description } : {}),
    })),
  }
}

export type ProductOfferJsonLd = {
  "@context": "https://schema.org"
  "@type": "Product"
  name: string
  description?: string
  image?: string
  url?: string
  category?: string
  brand?: { "@type": "Brand"; name: string }
  offers: {
    "@type": "Offer"
    price: string
    priceCurrency: string
    availability: string
    priceValidUntil?: string
    url?: string
  }
}

/**
 * Дата, до которой действует цена (schema.org рекомендует priceValidUntil,
 * иначе Search Console показывает предупреждение). По умолчанию — конец
 * следующего года от текущей даты, т.е. предложение считается актуальным.
 */
export function defaultPriceValidUntil(now: Date = new Date()): string {
  return `${now.getUTCFullYear() + 1}-12-31`
}

export function buildProductOfferJsonLd(input: {
  name: string
  description?: string
  image?: string
  url?: string
  category?: string
  brandName?: string
  price: string | number
  priceCurrency?: string
  /** If seats/available dates known, flag availability. Default conservative = OutOfStock. */
  availableSeats?: number | null
  hasAvailability?: boolean
  /** Дата актуальности цены (YYYY-MM-DD). По умолчанию — конец следующего года. */
  priceValidUntil?: string
}): ProductOfferJsonLd | null {
  const name = stripFaqHtml(input.name)
  if (!name) return null
  const priceRaw = String(input.price ?? "").replace(/[^\d.]/g, "") || "0"
  const priceNum = Number(priceRaw)
  // Must be valid positive price. If 0 or NaN or negative — refuse to emit Offer (google penalises 0-price).
  if (!Number.isFinite(priceNum) || priceNum <= 0) return null
  const description = input.description ? stripFaqHtml(input.description) : undefined
  const brand = input.brandName ? stripFaqHtml(input.brandName) : undefined
  const SCHEMA_IN_STOCK = "https://schema.org/InStock"
  const SCHEMA_OUT_OF_STOCK = "https://schema.org/OutOfStock"
  const availability =
    input.hasAvailability === true ||
    (typeof input.availableSeats === "number" && input.availableSeats > 0)
      ? SCHEMA_IN_STOCK
      : SCHEMA_OUT_OF_STOCK

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    ...(description ? { description } : {}),
    ...(input.image ? { image: input.image } : {}),
    ...(input.url ? { url: input.url } : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(brand ? { brand: { "@type": "Brand", name: brand } } : {}),
    offers: {
      "@type": "Offer",
      price: String(priceNum),
      priceCurrency: input.priceCurrency || "BYN",
      availability,
      priceValidUntil: input.priceValidUntil || defaultPriceValidUntil(),
      ...(input.url ? { url: input.url } : {}),
    },
  }
}
