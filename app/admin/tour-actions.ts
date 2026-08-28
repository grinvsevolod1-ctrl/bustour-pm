"use server"

// Server actions домена «Туры», вынесены из app/admin/actions.ts
// (см. соглашение: доменные actions живут в отдельных файлах,
// actions.ts реэкспортирует их для обратной совместимости импортов).

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireAdmin, requireCapability } from "@/lib/auth"
import { writeAudit, auditTourSnapshot } from "@/lib/admin-audit"
import { mutateThenRedirect } from "@/lib/admin-redirect"
import {
  createTour,
  updateTour,
  deleteTour,
  restoreTour,
  purgeTour,
  moveTour,
  reorderTours,
  saveTourDatesTable,
  getTourById,
  findTourIdBySlug,
  type TourInput,
} from "@/lib/queries"
import { getCountries } from "@/lib/countries"
import { getCityDestinations } from "@/lib/cities"
import { resolveBusTourDestinationIds } from "@/lib/tour-destinations"
import { getCurrencies } from "@/lib/currencies-server"
import { getBaseCurrency, formatMoney } from "@/lib/currencies"
import { parseAlertKind } from "@/lib/alert-kind"
import { replacePageFaqs, saveSettings } from "@/lib/cms"
import { parseFaqGroups } from "@/lib/faq-form"
import { rekeyPageScopedContent } from "@/lib/page-rekey"
import type { DatesTable } from "@/lib/types"
import { mapDbError } from "@/lib/db-errors"
import { tourSaveSchema, zodFirstError } from "@/lib/validations/admin"
import { parseGallery, parseDocuments, parseLayout, parseWhatIncluded } from "./form-parsers"

async function tourFromForm(formData: FormData): Promise<TourInput | { error: string }> {
  // — Program parsing (new rich multi-block format + backward compat with legacy) —
  const dayStarts = formData.getAll("programDayStart")
  const dayEnds = formData.getAll("programDayEnd")
  const customTitles = formData.getAll("programCustomTitle")
  const texts = formData.getAll("programText")
  const legacyTitles = formData.getAll("programTitle")

  function clampDay(v: unknown): number | undefined {
    const n = typeof v === "number" ? v : Number(String(v ?? "").trim())
    if (!Number.isFinite(n) || n < 1 || n > 400) return undefined
    return Math.trunc(n)
  }

  let program: { day: string; text: string; dayStart?: number; dayEnd?: number }[]
  if (dayStarts.length || customTitles.length || (legacyTitles.length === 0 && texts.length > 0)) {
    const count = Math.max(dayStarts.length, customTitles.length, texts.length)
    program = Array.from({ length: count }, (_, i) => {
      const dayStart = clampDay(dayStarts[i])
      const dayEnd = clampDay(dayEnds[i])
      const customTitle = String(customTitles[i] ?? "").trim()
      const text = String(texts[i] ?? "").trim()

      let day = ""
      if (customTitle) {
        day = customTitle
      } else if (dayStart != null && dayEnd != null && dayStart !== dayEnd) {
        const [a, b] = dayStart < dayEnd ? [dayStart, dayEnd] : [dayEnd, dayStart]
        day = `Дни ${a}–${b}`
      } else if (dayStart != null) {
        day = `День ${dayStart}`
      } else {
        day = `Блок ${i + 1}`
      }
      return { day, text, dayStart, dayEnd }
    }).filter((p) => p.text || p.day.startsWith("День") || p.day.startsWith("Дни") || p.day.startsWith("Блок"))
  } else {
    // Legacy fallback — old programTitle / programText arrays
    const programTextsLegacy = formData.getAll("programText").map((v) => String(v))
    program = legacyTitles
      .map((title, i) => ({
        day: String(title).trim() || `День ${i + 1}`,
        text: (programTextsLegacy[i] || "").trim(),
      }))
      .filter((p) => p.text || p.day)
  }

  const whatIncluded = parseWhatIncluded(formData.get("whatIncluded"))
  // Keep the flat included/excluded arrays in sync for backward compatibility.
  const included = whatIncluded[0]?.items ?? []
  const excluded = whatIncluded[1]?.items ?? []

  // Resolve country and arrival city against existing bus destinations only.
  const countryId = String(formData.get("countryId") || "").trim()
  const arrivalCityId = String(formData.get("arrivalCityId") || "").trim()
  const [busCountries, busCities] = await Promise.all([getCountries("bus"), getCityDestinations("bus")])
  const destination = resolveBusTourDestinationIds(countryId, arrivalCityId, busCountries, busCities)
  if (destination.error) return { error: destination.error }
  const country = busCountries.find((candidate) => candidate.id === destination.countryId)
  const city = busCities.find((candidate) => candidate.id === destination.arrivalCityId)
  if (!country || !city) return { error: "Выберите существующие автобусные страну и город." }

  // Price is entered in the chosen dates/base currency; validate both currencies against the admin list.
  const priceAmount = Number(formData.get("priceAmount") || 0) || 0
  const extraPriceAmount = Number(formData.get("extraPriceAmount") || 0) || 0
  const extraPriceCurrencyRaw = String(formData.get("extraPriceCurrency") || "").trim().toUpperCase()
  const datesCurrencyRaw = String(formData.get("datesCurrency") || "").trim().toUpperCase()
  const currencies = await getCurrencies()
  const base = getBaseCurrency(currencies)
  // Whitelist validation: only allow currency codes defined in admin currencies table (fallback to base).
  const datesCurrency = currencies.some((c) => c.code.toUpperCase() === datesCurrencyRaw)
    ? datesCurrencyRaw
    : (base?.code || "BYN")
  const extraPriceCurrency = currencies.some((c) => c.code.toUpperCase() === extraPriceCurrencyRaw)
    ? extraPriceCurrencyRaw
    : currencies.some((c) => c.code === "USD") ? "USD" : (base?.code || "BYN")
  const price = formatMoney(priceAmount, datesCurrency)

  return {
    slug: String(formData.get("slug") || "").trim(),
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    price,
    priceAmount,
    extraPriceAmount,
    extraPriceCurrency,
    datesCurrency,
    image: String(formData.get("image") || "").trim(),
    tourType: String(formData.get("tourType") || "").trim(),
    duration: String(formData.get("duration") || "").trim(),
    departure: String(formData.get("departure") || "").trim(),
    country: country.name,
    countryId: country.id,
    arrivalCityId: city.id,
    nights: Number(formData.get("nights") || 0),
    featured: formData.get("featured") === "on",
    program,
    included,
    excluded,
    whatIncluded,
    seoHtml: String(formData.get("seoHtml") || "").trim(),
    seoTitle: String(formData.get("seoTitle") || "").trim(),
    alertText: String(formData.get("alertText") || "").trim(),
    alertType: parseAlertKind(String(formData.get("alertType") || "")),
    gallery: parseGallery(formData.get("gallery")),
    documents: parseDocuments(formData.get("documents")),
    layout: parseLayout(formData.get("layout")),
  }
}

type TourActionState = { error?: string; success?: boolean }

export async function saveTourAction(_prev: unknown, formData: FormData): Promise<TourActionState> {
  const admin = await requireAdmin()
  const parsed = await tourFromForm(formData)
  if ("error" in parsed) return parsed
  const input = parsed
  const validated = tourSaveSchema.safeParse({
    slug: input.slug,
    title: input.title,
    description: input.description,
    priceAmount: input.priceAmount,
    image: input.image,
    seoTitle: input.seoTitle,
    seoHtml: input.seoHtml,
  })
  if (!validated.success) return { error: zodFirstError(validated.error) }
  if (!String(formData.get("priceAmount") ?? "").trim()) return { error: "Заполните цену" }
  const id = Number(formData.get("id") || 0)
  const slugOwner = await findTourIdBySlug(input.slug)
  if (slugOwner && slugOwner !== id) {
    return { error: `Тур со slug «${input.slug}» уже существует — укажите другой slug` }
  }
  const before = id ? await getTourById(id) : null
  let newId = 0
  try {
    if (id) {
      if (before && before.slug !== input.slug) {
        await rekeyPageScopedContent(`tour:${before.slug}`, `tour:${input.slug}`)
      }
      await updateTour(id, input)
    } else {
      newId = await createTour(input)
    }
  } catch (err) {
    return { error: mapDbError(err, "Не удалось сохранить тур") }
  }
  const savedTourId = id || newId
  await writeAudit({
    admin,
    action: id ? "tour_update" : "tour_create",
    entityType: "tour",
    entityId: savedTourId,
    summary: id ? `Обновлён тур «${input.title}»` : `Создан тур «${input.title}»`,
    before: before ? auditTourSnapshot(before) : undefined,
    after: auditTourSnapshot({ id: savedTourId, ...input }),
  })
  // Meta и FAQ сохраняются отдельными запросами после тура (без общей
  // транзакции). Все операции — идемпотентные upsert'ы, поэтому при падении
  // здесь достаточно явно попросить админа пересохранить форму: повторное
  // сохранение приведёт данные в согласованное состояние.
  try {
    await saveSettings({
      [`tour:${savedTourId}.metaTitle`]: String(formData.get("metaTitle") || "").trim(),
      [`tour:${savedTourId}.metaDescription`]: String(formData.get("metaDescription") || "").trim(),
      [`tour:${savedTourId}.metaShortDesc`]: String(formData.get("metaShortDesc") || "").trim(),
      [`tour:${savedTourId}.metaImage`]: String(formData.get("metaImage") || "").trim(),
      [`tour:${savedTourId}.metaImageAlt`]: String(formData.get("metaImageAlt") || "").trim(),
    })
    // FAQ трогаем только если блок реально был на форме (маркер __faqPresent).
    // Иначе скрытая/отключённая секция уходит как «пустой FAQ» и стирает вопросы.
    if (String(formData.get("__faqPresent") || "") === "1") {
      const groups = parseFaqGroups(formData)
      // Незаполненная пара «вопрос+ответ» не должна молча удалять сохранённый FAQ:
      // если пользователь что-то ввёл, но пара неполная (groups пусто), сохранение
      // FAQ пропускаем и оставляем прежние вопросы. Полное очищение возможно только
      // когда в редакторе действительно пусто.
      const rawHadContent =
        formData.getAll("faqGroupTitle").some((v) => String(v).trim()) ||
        formData.getAll("faqQuestion").some((v) => String(v).trim()) ||
        formData.getAll("faqAnswer").some((v) => String(v).replace(/<[^>]*>/g, "").trim())
      if (groups.length || !rawHadContent) {
        await replacePageFaqs(`tour:${input.slug}`, groups)
      }
    }
  } catch (err) {
    return {
      error: mapDbError(err, "Тур сохранён, но не удалось сохранить SEO-мета или FAQ — сохраните форму ещё раз"),
    }
  }
  revalidatePath("/admin/tours")
  revalidatePath(`/admin/tours/${savedTourId}`)
  revalidatePath("/")
  revalidatePath("/avtobusnye-tury/")
  revalidatePath("/aviatory/")
  revalidatePath("/hot/")
  if (id) return { success: true }
  redirect(`/admin/tours/${newId}?notice=${encodeURIComponent("Тур создан")}`)
}

export async function saveTourDatesTableAction(_prev: unknown, formData: FormData) {
  const admin = await requireAdmin()
  const tourId = Number(formData.get("tourId") || 0)
  if (!tourId) return { error: "Не указан тур" }
  let table: DatesTable
  try {
    table = JSON.parse(String(formData.get("table") || "{}")) as DatesTable
  } catch {
    return { error: "Не удалось прочитать данные дат" }
  }
  const tour = await getTourById(tourId)
  if (!tour) return { error: "Автобусный тур не найден" }
  try {
    await saveTourDatesTable(tourId, table)
    await writeAudit({
      admin,
      action: "tour_dates_update",
      entityType: "tour",
      entityId: tourId,
      summary: tour.title ? `Обновлены даты тура «${tour.title}»` : `Обновлены даты тура #${tourId}`,
    })
    revalidatePath("/admin/tour-pricing")
    revalidatePath(`/admin/tour-pricing/${tourId}`)
    revalidatePath("/avtobusnye-tury")
    if (tour.countrySlug && tour.citySlug) revalidatePath(`/avtobusnye-tury/${tour.countrySlug}/${tour.citySlug}/${tour.slug}`)
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : ""
    return { error: message || "Не удалось сохранить даты и цены" }
  }
}

export async function deleteTourAction(formData: FormData) {
  const admin = await requireAdmin()
  const id = Number(formData.get("id") || 0)
  const before = id ? await getTourById(id) : null
  return mutateThenRedirect(
    async () => {
      if (id) await deleteTour(id)
      await writeAudit({
        admin,
        action: "tour_archive",
        entityType: "tour",
        entityId: id,
        summary: before ? `В архив: «${before.title}»` : `В архив тур #${id}`,
        before: before ? auditTourSnapshot(before) : undefined,
      })
      revalidatePath("/admin/tours")
      revalidatePath("/admin/archive")
      revalidatePath("/")
    },
    "/admin/tours?notice=archived",
    "/admin/tours",
  )
}

export async function moveTourAction(formData: FormData) {
  const admin = await requireAdmin()
  const id = Number(formData.get("id") || 0)
  const direction = String(formData.get("direction") || "up") === "down" ? "down" : "up"
  if (id) await moveTour(id, direction)
  const tour = id ? await getTourById(id) : undefined
  await writeAudit({
    admin,
    action: "tour_move",
    entityType: "tour",
    entityId: id,
    summary: tour
      ? `Перемещён тур «${tour.title}» (${direction})`
      : `Перемещён тур #${id} (${direction})`,
    after: { direction, country: tour?.country },
  })
  revalidatePath("/admin/tours")
  revalidatePath("/", "layout")
}

export async function reorderToursAction(formData: FormData) {
  const admin = await requireAdmin()
  let orderedIds: number[] = []
  try {
    const parsed = JSON.parse(String(formData.get("orderedIds") || "[]"))
    orderedIds = Array.isArray(parsed)
      ? parsed.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
      : []
  } catch {
    orderedIds = []
  }
  if (orderedIds.length < 2) return
  await reorderTours(orderedIds)
  const first = await getTourById(orderedIds[0])
  await writeAudit({
    admin,
    action: "tour_reorder",
    entityType: "tour",
    entityId: orderedIds[0],
    summary: "Обновлён порядок туров перетаскиванием",
    after: { orderedIds, country: first?.country },
  })
  revalidatePath("/admin/tours")
  revalidatePath("/", "layout")
}

export async function restoreTourAction(formData: FormData) {
  const admin = await requireAdmin()
  const id = Number(formData.get("id") || 0)
  const before = id ? await getTourById(id) : null
  return mutateThenRedirect(
    async () => {
      if (id) await restoreTour(id)
      const after = id ? await getTourById(id) : null
      await writeAudit({
        admin,
        action: "tour_restore",
        entityType: "tour",
        entityId: id,
        summary: before ? `Восстановлен: «${before.title}»` : `Восстановлен тур #${id}`,
        before: before ? auditTourSnapshot(before) : undefined,
        after: after ? auditTourSnapshot(after) : undefined,
      })
      revalidatePath("/admin/tours")
      revalidatePath("/admin/archive")
      revalidatePath("/")
      if (after?.countrySlug && after.citySlug && after.slug) {
        revalidatePath(`/avtobusnye-tury/${after.countrySlug}/${after.citySlug}/${after.slug}`)
      }
    },
    // Land on active list so restored row is visible immediately (and page is dynamic via searchParams).
    "/admin/tours?notice=restored",
    "/admin/archive",
  )
}

export async function purgeTourAction(formData: FormData) {
  const admin = await requireCapability("purge")
  const id = Number(formData.get("id") || 0)
  const before = id ? await getTourById(id) : null
  return mutateThenRedirect(
    async () => {
      if (id) await purgeTour(id)
      await writeAudit({
        admin,
        action: "tour_purge",
        entityType: "tour",
        entityId: id,
        summary: before ? `Удалён тур «${before.title}»` : `Удалён тур #${id}`,
        before: before ? auditTourSnapshot(before) : undefined,
      })
      revalidatePath("/admin/tours")
      revalidatePath("/admin/archive")
      revalidatePath("/")
    },
    "/admin/archive?notice=purged",
    "/admin/archive",
  )
}
