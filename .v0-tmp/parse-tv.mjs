import ExcelJS from "exceljs"
import { writeFileSync } from "node:fs"

const DIR = new URL(".", import.meta.url).pathname

function norm(v) {
  if (v == null) return ""
  if (typeof v === "object" && "text" in v) return String(v.text).trim()
  if (typeof v === "object" && "result" in v) return String(v.result).trim()
  return String(v).trim()
}

async function readSheet(file) {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(DIR + file).catch(async () => {
    // .xls (old format) — exceljs can't read; fall through
    throw new Error("xlsx read failed for " + file)
  })
  return wb
}

// exceljs cannot read legacy .xls. The three files: two .xls + xlsx params.
// We only need the code tables from the .xls files. Try xlsx first; if legacy,
// print so we can convert.
async function main() {
  const results = {}
  for (const f of ["Коды городов и стран.xls", "Коды стран и курортов.xls"]) {
    try {
      const wb = await readSheet(f)
      const sheets = []
      wb.eachSheet((ws) => {
        const rows = []
        ws.eachRow((row) => {
          rows.push(row.values.slice(1).map(norm))
        })
        sheets.push({ name: ws.name, rows })
      })
      results[f] = sheets
    } catch (e) {
      results[f] = { error: String(e.message) }
    }
  }
  writeFileSync(DIR + "raw-parse.json", JSON.stringify(results, null, 2))
  console.log(JSON.stringify(Object.fromEntries(Object.entries(results).map(([k, v]) => [k, Array.isArray(v) ? v.map(s => ({ name: s.name, rowCount: s.rows.length, sample: s.rows.slice(0, 5) })) : v])), null, 2))
}
main()
