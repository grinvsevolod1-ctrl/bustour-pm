/**
 * Групповой экспорт/импорт программы тура «по дням» и блока «что входит/не входит»
 * через Excel (.xlsx) — по одному листу на тур (имя листа начинается с "#ID").
 *
 * Формат листа (колонка «Тип строки» задаёт смысл остальных ячеек):
 *   Тип = "День"    — строка программы: B=метка дня, C=день с, D=день по, F=текст (HTML).
 *   Тип = "Группа"  — заголовок группы «что входит»: B=название, E=маркер.
 *   Тип = "Пункт"   — пункт последней группы: F=текст пункта.
 *
 * Правило импорта: программа обновляется, если на листе есть строки «День».
 * Блок «что входит» обновляется, только если на листе есть строки «Группа» —
 * поэтому экспорт «только программа» (без строк «Группа») при загрузке НЕ затирает
 * уже заполненный блок «что входит».
 */
import ExcelJS from "exceljs"
import type { IncludedMarker, Tour } from "@/lib/types"
import { sanitizeCmsHtml } from "@/lib/sanitize-html"

const SHEET_NAME_MAX = 31
const INSTRUCTIONS_SHEET = "Инструкция"

const ROW_TYPE_DAY = "День"
const ROW_TYPE_GROUP = "Группа"
const ROW_TYPE_ITEM = "Пункт"

const MARKERS: readonly IncludedMarker[] = ["check", "dot", "cross", "star", "dash"]
const MARKER_HINT = `Маркер группы: ${MARKERS.join(", ")} (по умолчанию check).`

const HEADERS = [
  "Тип строки (День / Группа / Пункт)",
  "Метка дня / Название группы",
  "День с",
  "День по",
  "Маркер (для группы)",
  "Текст (для дня — HTML, для пункта — обычный текст)",
] as const

/** Excel запрещает \ / ? * [ ] : в имени листа и ограничивает длину 31 символом. */
function sheetNameForTour(tour: Tour): string {
  const prefix = `#${tour.id} `
  const safeTitle = (tour.title || `Тур ${tour.id}`).replace(/[\\/?*[\]:]/g, " ").trim()
  const maxTitleLen = Math.max(0, SHEET_NAME_MAX - prefix.length)
  return (prefix + safeTitle).slice(0, prefix.length + maxTitleLen) || `#${tour.id}`
}

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "object") {
    const obj = value as unknown as Record<string, unknown>
    if ("text" in obj) return String(obj.text ?? "")
    if ("result" in obj) return String(obj.result ?? "")
    if ("richText" in obj && Array.isArray((obj as { richText?: unknown[] }).richText)) {
      return ((obj as { richText: { text?: string }[] }).richText).map((part) => part.text ?? "").join("")
    }
  }
  return String(value)
}

function cellInt(value: ExcelJS.CellValue): number | undefined {
  const raw = cellText(value).trim()
  if (!raw) return undefined
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) ? n : undefined
}

function normalizeMarker(raw: string): IncludedMarker {
  const value = raw.trim().toLowerCase()
  return (MARKERS as readonly string[]).includes(value) ? (value as IncludedMarker) : "check"
}

export function buildProgramWorkbook(tours: Tour[], includeWhatIncluded: boolean): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Bastour admin"
  workbook.created = new Date()

  const info = workbook.addWorksheet(INSTRUCTIONS_SHEET)
  info.columns = [{ width: 110 }]
  const lines = [
    "Экспорт программы туров «по дням» и блока «что входит» — по одному листу на тур.",
    "",
    "Колонка «Тип строки» задаёт смысл остальных ячеек:",
    "  День   — строка программы: «Метка дня» (например «1 день» или «1-2 день»),",
    "           «День с» / «День по» (числа, необязательно), «Текст» — описание дня (можно с HTML-тегами).",
    "  Группа — заголовок блока «что входит»: «Метка/Название» = название группы, «Маркер» = вид значка.",
    "  Пункт  — один пункт последней группы: текст пишите в колонку «Текст».",
    "",
    MARKER_HINT,
    "",
    "Правила загрузки обратно:",
    "  • Программа тура обновляется, если на листе есть строки «День».",
    "  • Блок «что входит» обновляется, только если на листе есть строки «Группа».",
    "    Файл без строк «Группа» НЕ затирает уже заполненный блок «что входит».",
    "",
    "Не удаляйте «#ID» в начале названия листа — по нему определяется, какой тур обновлять.",
    "Не переименовывайте и не удаляйте лист «Инструкция» — он игнорируется при загрузке.",
  ]
  lines.forEach((line, i) => {
    const row = info.getRow(i + 1)
    row.getCell(1).value = line
    if (i === 0) row.getCell(1).font = { bold: true, size: 13 }
  })

  for (const tour of tours) {
    const sheet = workbook.addWorksheet(sheetNameForTour(tour))
    sheet.columns = [{ width: 16 }, { width: 30 }, { width: 9 }, { width: 9 }, { width: 16 }, { width: 80 }]

    const headerRow = sheet.getRow(1)
    HEADERS.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1)
      cell.value = h
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2F5233" } }
      cell.alignment = { wrapText: true, vertical: "middle" }
    })
    sheet.views = [{ state: "frozen", ySplit: 1 }]
    sheet.getColumn(6).alignment = { wrapText: true, vertical: "top" }

    let r = 2
    for (const block of tour.program ?? []) {
      const row = sheet.getRow(r++)
      row.getCell(1).value = ROW_TYPE_DAY
      row.getCell(2).value = block.day ?? ""
      row.getCell(3).value = block.dayStart ?? ""
      row.getCell(4).value = block.dayEnd ?? ""
      row.getCell(6).value = block.text ?? ""
    }

    if (includeWhatIncluded) {
      for (const group of tour.whatIncluded ?? []) {
        const groupRow = sheet.getRow(r++)
        groupRow.getCell(1).value = ROW_TYPE_GROUP
        groupRow.getCell(2).value = group.title ?? ""
        groupRow.getCell(5).value = group.marker ?? "check"
        groupRow.getCell(1).font = { bold: true }
        groupRow.getCell(2).font = { bold: true }
        for (const item of group.items ?? []) {
          const itemRow = sheet.getRow(r++)
          itemRow.getCell(1).value = ROW_TYPE_ITEM
          itemRow.getCell(6).value = item ?? ""
        }
      }
    }
  }

  return workbook
}

export type ProgramImportUpdate = {
  tourId: number
  tourTitle: string
  program?: Tour["program"]
  whatIncluded?: Tour["whatIncluded"]
}
export type ProgramImportError = { sheet: string; row?: number; message: string }

export function parseProgramWorkbook(
  workbook: ExcelJS.Workbook,
  existingTours: Tour[],
): { updates: ProgramImportUpdate[]; errors: ProgramImportError[] } {
  const toursById = new Map(existingTours.map((t) => [t.id, t]))
  const updates: ProgramImportUpdate[] = []
  const errors: ProgramImportError[] = []

  for (const sheet of workbook.worksheets) {
    if (sheet.name === INSTRUCTIONS_SHEET) continue
    const match = sheet.name.match(/^#(\d+)/)
    if (!match) {
      errors.push({ sheet: sheet.name, message: `Не найден "#ID" в начале названия листа — лист пропущен.` })
      continue
    }
    const tourId = Number(match[1])
    const tour = toursById.get(tourId)
    if (!tour) {
      errors.push({ sheet: sheet.name, message: `Тур #${tourId} не найден (возможно, удалён) — лист пропущен.` })
      continue
    }

    const program: NonNullable<Tour["program"]> = []
    const groups: NonNullable<Tour["whatIncluded"]> = []
    let hasGroupRows = false
    let currentGroup: (typeof groups)[number] | null = null

    const lastRow = sheet.actualRowCount || sheet.rowCount
    for (let r = 2; r <= lastRow; r++) {
      const excelRow = sheet.getRow(r)
      if (!excelRow || excelRow.cellCount === 0) continue
      const rowType = cellText(excelRow.getCell(1).value).trim().toLowerCase()
      if (!rowType) continue

      if (rowType === ROW_TYPE_DAY.toLowerCase()) {
        const day = cellText(excelRow.getCell(2).value).trim()
        const dayStart = cellInt(excelRow.getCell(3).value)
        const dayEnd = cellInt(excelRow.getCell(4).value)
        const text = sanitizeCmsHtml(cellText(excelRow.getCell(6).value))
        if (!day && !text) continue
        program.push({ day, text, ...(dayStart != null ? { dayStart } : {}), ...(dayEnd != null ? { dayEnd } : {}) })
      } else if (rowType === ROW_TYPE_GROUP.toLowerCase()) {
        hasGroupRows = true
        const title = cellText(excelRow.getCell(2).value).trim()
        const marker = normalizeMarker(cellText(excelRow.getCell(5).value))
        currentGroup = { title, marker, items: [] }
        groups.push(currentGroup)
      } else if (rowType === ROW_TYPE_ITEM.toLowerCase()) {
        const item = cellText(excelRow.getCell(6).value).trim()
        if (!item) continue
        if (!currentGroup) {
          errors.push({ sheet: sheet.name, row: r, message: `Пункт без группы (нет строки «Группа» выше) — строка пропущена.` })
          continue
        }
        currentGroup.items.push(item)
      } else {
        errors.push({ sheet: sheet.name, row: r, message: `Неизвестный тип строки «${rowType}» — ожидается День / Группа / Пункт.` })
      }
    }

    const update: ProgramImportUpdate = { tourId, tourTitle: tour.title || `#${tourId}` }
    if (program.length) update.program = program
    // Блок «что входит» трогаем только если в файле реально были строки «Группа».
    if (hasGroupRows) update.whatIncluded = groups.filter((g) => g.title || g.items.length)

    if (update.program || update.whatIncluded) {
      updates.push(update)
    } else {
      errors.push({ sheet: sheet.name, message: `Лист не содержит строк «День» или «Группа» — нечего обновлять.` })
    }
  }

  return { updates, errors }
}
