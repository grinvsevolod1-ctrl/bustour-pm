import * as XLSX from "xlsx"
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"

const DIR = new URL(".", import.meta.url).pathname
const OUT = DIR + "../lib/tourvisor/reference-data.ts"

function rows(file, sheet) {
  const wb = XLSX.read(readFileSync(DIR + file), { type: "buffer", codepage: 1251 })
  return XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, blankrows: false, defval: "" })
}

const num = (v) => {
  const n = typeof v === "number" ? v : parseInt(String(v).trim(), 10)
  return Number.isFinite(n) ? n : null
}
const str = (v) => String(v ?? "").trim()

// Города вылета: [Код, Город]
const departureRows = rows("Коды городов и стран.xls", "Города вылета").slice(1)
const departures = departureRows
  .map((r) => ({ code: num(r[0]), name: str(r[1]) }))
  .filter((d) => d.code != null && d.name)

// Страны: [Код, Страна]
const countryRows = rows("Коды городов и стран.xls", "Страны").slice(1)
const countries = countryRows
  .map((r) => ({ code: num(r[0]), name: str(r[1]) }))
  .filter((c) => c.code != null && c.name)

// Курорты: [Код страны, Страна, Код курорта, Курорт]
const resortRows = rows("Коды стран и курортов.xls", "Курорты").slice(1)
const resorts = resortRows
  .map((r) => ({ countryCode: num(r[0]), countryName: str(r[1]), code: num(r[2]), name: str(r[3]) }))
  .filter((r) => r.countryCode != null && r.code != null && r.name)

const banner = `// АВТОГЕНЕРАЦИЯ из справочников Tourvisor (Коды городов/стран/курортов).
// Не редактировать вручную: пересобирается парсером из исходных xls Tourvisor.
// Источник числовых кодов для виджетов tv-* и связывания наших стран/курортов.
`

const body = `${banner}
export type TourvisorDeparture = { readonly code: number; readonly name: string }
export type TourvisorCountry = { readonly code: number; readonly name: string }
export type TourvisorResort = {
  readonly countryCode: number
  readonly countryName: string
  readonly code: number
  readonly name: string
}

export const TOURVISOR_DEPARTURES: readonly TourvisorDeparture[] = ${JSON.stringify(departures, null, 2)}

export const TOURVISOR_COUNTRIES: readonly TourvisorCountry[] = ${JSON.stringify(countries, null, 2)}

export const TOURVISOR_RESORTS: readonly TourvisorResort[] = ${JSON.stringify(resorts, null, 2)}
`

mkdirSync(DIR + "../lib/tourvisor", { recursive: true })
writeFileSync(OUT, body)
console.log(`departures=${departures.length} countries=${countries.length} resorts=${resorts.length}`)
console.log("wrote", OUT)
