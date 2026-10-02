#!/usr/bin/env node
/**
 * Обновляет снимок справочника Tourvisor (страны и курорты с их ID)
 * в lib/tourvisor-directory.json.
 *
 * Зачем: поисковые модули Tourvisor на страницах стран/курортов получают
 * страну и курорт через атрибуты tv-country / tv-resorts, а ID берутся из
 * этого справочника по названию (если админ не задал ID вручную).
 *
 * Источник — тот же публичный endpoint, которым пользуется сам виджет в
 * браузере (listdev.php), авторизация не нужна. ID у Tourvisor стабильные,
 * поэтому снимок достаточно обновлять изредка: `npm run tourvisor:sync`.
 */
import { writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const SOURCE = "https://tourvisor.ru/xml/listdev.php?type=allcountry,region&format=json"
// Без query-параметра referrer endpoint отвечает пустым телом (заголовок Referer не учитывается).
const SITE_REFERRER = process.env.NEXT_PUBLIC_SITE_URL || "https://bus-tour.by/"
const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const target = join(root, "lib", "tourvisor-directory.json")

const res = await fetch(`${SOURCE}&referrer=${encodeURIComponent(SITE_REFERRER)}`, {
  headers: { "User-Agent": "Mozilla/5.0 (bus-tour.by directory sync)" },
})
if (!res.ok) {
  console.error(`tourvisor-directory-sync: HTTP ${res.status} from Tourvisor`)
  process.exit(1)
}
const payload = await res.json()
const lists = payload.lists ?? payload
const rawCountries = lists.allcountry?.country ?? []
const rawRegions = lists.regions?.region ?? []

const countries = rawCountries
  .map((c) => [Number(c.id), String(c.name ?? "").trim()])
  .filter(([id, name]) => Number.isInteger(id) && id > 0 && name)
  .sort((a, b) => a[0] - b[0])

const resorts = rawRegions
  .map((r) => [Number(r.id), Number(r.country), Number(r.parentid ?? 0) || 0, String(r.name ?? "").trim()])
  .filter(([id, countryId, , name]) => Number.isInteger(id) && id > 0 && Number.isInteger(countryId) && name)
  .sort((a, b) => a[1] - b[1] || a[2] - b[2] || a[0] - b[0])

if (countries.length < 50 || resorts.length < 500) {
  console.error(
    `tourvisor-directory-sync: suspiciously small directory (${countries.length} countries, ${resorts.length} resorts) — not written`,
  )
  process.exit(1)
}

const snapshot = {
  fetchedAt: new Date().toISOString().slice(0, 10),
  source: SOURCE,
  /** [id, name] */
  countries,
  /** [id, countryId, parentId, name] — parentId 0 = курорт верхнего уровня */
  resorts,
}

writeFileSync(target, `${JSON.stringify(snapshot)}\n`)
console.log(`tourvisor-directory-sync: ${countries.length} countries, ${resorts.length} resorts → lib/tourvisor-directory.json`)
