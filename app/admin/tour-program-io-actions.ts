"use server"

import ExcelJS from "exceljs"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth"
import { writeAudit } from "@/lib/admin-audit"
import { getBusTours, saveTourContent } from "@/lib/queries"
import { buildProgramWorkbook, parseProgramWorkbook, type ProgramImportError } from "@/lib/tour-program-excel"

const MAX_IMPORT_SIZE_BYTES = 12 * 1024 * 1024 // 12 МБ — программа с HTML тяжелее прайса, запас

export type ExportProgramParams = { tourIds: number[] | "all"; includeWhatIncluded: boolean }

export async function exportTourProgramAction(
  params: ExportProgramParams,
): Promise<{ success: true; base64: string; filename: string } | { success: false; error: string }> {
  await requireAdmin()
  try {
    const all = await getBusTours()
    const selected =
      params.tourIds === "all" ? all : all.filter((t) => (params.tourIds as number[]).includes(t.id))
    if (!selected.length) {
      return { success: false, error: "Не выбрано ни одного тура для выгрузки" }
    }
    const workbook = buildProgramWorkbook(selected, params.includeWhatIncluded)
    const buffer = await workbook.xlsx.writeBuffer()
    const today = new Date().toISOString().slice(0, 10)
    const scope = params.tourIds === "all" ? "vse" : `vybor-${selected.length}`
    return {
      success: true,
      base64: Buffer.from(buffer as ArrayBuffer).toString("base64"),
      filename: `bastur-programma-turov-${scope}-${today}.xlsx`,
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Не удалось сформировать файл" }
  }
}

export type ImportProgramState = {
  success: boolean
  error?: string
  updatedCount?: number
  updatedTitles?: string[]
  errors?: ProgramImportError[]
} | null

export async function importTourProgramAction(
  _prev: ImportProgramState,
  formData: FormData,
): Promise<ImportProgramState> {
  const admin = await requireAdmin()
  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Выберите файл .xlsx для загрузки" }
  }
  if (file.size > MAX_IMPORT_SIZE_BYTES) {
    return { success: false, error: "Файл слишком большой (максимум 12 МБ)" }
  }

  let workbook: ExcelJS.Workbook
  try {
    const arrayBuffer = await file.arrayBuffer()
    workbook = new ExcelJS.Workbook()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exceljs types lag behind Node's Buffer generics
    await workbook.xlsx.load(Buffer.from(arrayBuffer) as any)
  } catch {
    return { success: false, error: "Не удалось прочитать файл. Убедитесь, что это .xlsx, полученный через «Скачать Excel»." }
  }

  const existingTours = await getBusTours()
  const { updates, errors } = parseProgramWorkbook(workbook, existingTours)

  const updatedTitles: string[] = []
  for (const update of updates) {
    try {
      await saveTourContent(update.tourId, { program: update.program, whatIncluded: update.whatIncluded })
      updatedTitles.push(update.tourTitle)
      const tour = existingTours.find((t) => t.id === update.tourId)
      if (tour?.countrySlug && tour.citySlug) {
        revalidatePath(`/avtobusnye-tury/${tour.countrySlug}/${tour.citySlug}/${tour.slug}`)
      }
      revalidatePath(`/admin/tours/${update.tourId}`)
    } catch (err) {
      errors.push({
        sheet: update.tourTitle,
        message: err instanceof Error ? err.message : "Не удалось сохранить программу для этого тура",
      })
    }
  }

  if (updatedTitles.length) {
    revalidatePath("/admin/tours")
    revalidatePath("/avtobusnye-tury")
    await writeAudit({
      admin,
      action: "tour_program_bulk_import",
      entityType: "tour",
      summary: `Импорт программы туров из Excel: обновлено — ${updatedTitles.length}`,
      meta: { updatedTitles, errorCount: errors.length },
    })
  }

  return {
    success: updatedTitles.length > 0,
    error: updatedTitles.length === 0 ? errors[0]?.message || "Не удалось обновить ни один тур" : undefined,
    updatedCount: updatedTitles.length,
    updatedTitles,
    errors,
  }
}
