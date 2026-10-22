import { headers } from "next/headers"
import { notFound, permanentRedirect } from "next/navigation"
import { getTour, getSlugMaps } from "@/lib/public/queries"
import { getPublicSettings, isTourVisiblePublic } from "@/lib/cms"
import { resolveAviaSlug } from "@/lib/avia-slug"
import { tourUrl } from "@/lib/tour-url"
import { INTERNAL_ORIGIN } from "@/lib/proxy-origin"

/**
 * Googlebot годами обходит URL старого сайта (WordPress/Bitrix): отели,
 * /detail/{slug}, слаги с подчёркиванием, удалённые туры. Вместо 404 отдаём
 * 301 на ближайшую живую страницу: тур с тем же слагом → город → страна →
 * раздел. Каждая цель проверяется внутренним HEAD-запросом, поэтому редирект
 * никогда не ведёт на 404 и не образует цепочку.
 */

type Branch = "bus" | "avia" | "hot"
type SlugParams = { countrySlug?: string; citySlug?: string; tourSlug?: string }

const PROBE_HEADER = "x-bastur-legacy-probe"

function normalizeSegment(raw: string): string {
  let s = raw
  try {
    s = decodeURIComponent(raw)
  } catch {}
  return s.trim().toLowerCase().replace(/_/g, "-").replace(/-{2,}/g, "-").replace(/^-|-$/g, "")
}

async function isLive(path: string): Promise<boolean> {
  try {
    const res = await fetch(`${INTERNAL_ORIGIN}${path}`, {
      method: "HEAD",
      redirect: "manual",
      cache: "no-store",
      headers: { [PROBE_HEADER]: "1" },
      signal: AbortSignal.timeout(3_000),
    })
    return res.status === 200
  } catch {
    return false
  }
}

async function branchBase(branch: Branch): Promise<string> {
  if (branch === "bus") return "/avtobusnye-tury"
  if (branch === "hot") return "/hot"
  const settings = await getPublicSettings()
  return `/${resolveAviaSlug(settings["aviatory.slug"])}`
}

async function findTourUrl(segments: string[]): Promise<string | null> {
  for (const seg of [...segments].reverse()) {
    const tour = await getTour(seg)
    if (!tour || tour.archived || !(await isTourVisiblePublic(tour.slug))) continue
    const slugMaps = await getSlugMaps()
    const url = tourUrl({
      tourSlug: tour.slug,
      countrySlug: slugMaps.countrySlugById[tour.countryId],
      citySlug: slugMaps.citySlugById[tour.arrivalCityId],
    })
    if (url) return url
  }
  return null
}

/** 301 на ближайшую живую страницу, иначе обычный 404. */
export async function legacyNotFound(branch: Branch, params: SlugParams): Promise<never> {
  const h = await headers()
  if (h.get(PROBE_HEADER)) notFound()

  const raw = [params.countrySlug, params.citySlug, params.tourSlug].filter(
    (s): s is string => typeof s === "string" && s.length > 0,
  )
  const segments = raw.map(normalizeSegment).filter(Boolean)
  const base = await branchBase(branch)
  const current = new Set([`${base}/${raw.join("/")}`, `${base}/${raw.map(normalizeSegment).join("/")}`])

  const tour = await findTourUrl(segments)
  const candidates: string[] = []
  if (tour) candidates.push(tour.replace(/\/$/, ""))
  for (let i = segments.length; i >= 1; i--) candidates.push(`${base}/${segments.slice(0, i).join("/")}`)
  candidates.push(base)

  // Текущий путь (и его нормализованная форма, если совпала) уже 404 —
  // пропускаем, чтобы не зациклиться.
  const seen = new Set<string>()
  for (const path of candidates) {
    if (seen.has(path) || current.has(path)) continue
    seen.add(path)
    if (await isLive(path)) permanentRedirect(path)
  }
  notFound()
}
