import * as XLSX from "xlsx"
import { writeFileSync, readFileSync } from "node:fs"

const DIR = new URL(".", import.meta.url).pathname

function sheetToRows(ws) {
  return XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: "" })
}

function dump(file) {
  const buf = readFileSync(DIR + file)
  const wb = XLSX.read(buf, { type: "buffer", codepage: 1251 })
  const out = {}
  for (const name of wb.SheetNames) {
    out[name] = sheetToRows(wb.Sheets[name])
  }
  return out
}

const a = dump("Коды городов и стран.xls")
const b = dump("Коды стран и курортов.xls")

const summary = {}
for (const [f, sheets] of Object.entries({ a, b })) {
  summary[f] = Object.fromEntries(
    Object.entries(sheets).map(([n, rows]) => [n, { count: rows.length, sample: rows.slice(0, 6) }]),
  )
}
writeFileSync(DIR + "cities-countries.json", JSON.stringify(a, null, 2))
writeFileSync(DIR + "countries-resorts.json", JSON.stringify(b, null, 2))
console.log(JSON.stringify(summary, null, 2))
