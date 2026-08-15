import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { writeAudit } from "@/lib/admin-audit"
import { mediaService, validateMediaFile } from "@/lib/media/service"

export const runtime = "nodejs"
/** Video ffmpeg encode can be slow on large files. */
export const maxDuration = 300

export async function POST(request: Request) {
  const admin = await requireAdmin().catch(() => null)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await request.formData()
  const entries = [...formData.getAll("files"), formData.get("file")]
  const files = entries.filter((entry): entry is File => entry instanceof File)
  if (!files.length) {
    return NextResponse.json({ error: "Файл не найден в запросе." }, { status: 400 })
  }

  const folderRaw = formData.get("folderId")
  const folderId =
    typeof folderRaw === "string" && folderRaw.trim() ? folderRaw.trim() : null

  const invalid = files
    .map((file) => ({ file, validation: validateMediaFile(file) }))
    .filter(({ validation }) => !validation.type)
  if (invalid.length) {
    return NextResponse.json(
      { error: invalid.map(({ file, validation }) => `«${file.name}»: ${validation.error}`).join(" ") },
      { status: 400 },
    )
  }

  // allSettled вместо Promise.all: при падении одного файла остальные уже
  // сохранены на диск — их нельзя «потерять» без записи в аудит, иначе
  // в медиатеке появляются файлы, которых нет в журнале действий.
  const results = await Promise.allSettled(files.map((file) => mediaService.saveFile(file, { folderId })))
  const uploaded = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []))
  const failed = results
    .map((r, i) => (r.status === "rejected" ? { name: files[i]?.name || "media", reason: r.reason } : null))
    .filter((f): f is { name: string; reason: unknown } => f !== null)

  if (uploaded.length) {
    await writeAudit({
      admin,
      action: "media_upload",
      entityType: "media",
      entityId: uploaded.map((f) => f.id).join(",") || undefined,
      summary:
        uploaded.length === 1 && !failed.length
          ? `Загружен файл «${files[0]?.name || "media"}»`
          : `Загружено файлов: ${uploaded.length}${failed.length ? `, с ошибкой: ${failed.length}` : ""}`,
      after: { count: uploaded.length, names: files.map((f) => f.name), ids: uploaded.map((f) => f.id) },
    }).catch((err) => console.error("[media/upload] audit failed:", err))
  }

  if (failed.length) {
    for (const f of failed) console.error("[media/upload]", f.name, f.reason)
    const first = failed[0].reason
    const msg = first instanceof Error ? first.message : String(first)
    const detail = msg.trim() ? ` ${msg.replace(/\s+/g, " ").slice(0, 240)}` : ""
    const prefix = uploaded.length
      ? `Сохранено файлов: ${uploaded.length}, не удалось: ${failed.map((f) => `«${f.name}»`).join(", ")}.`
      : "Не удалось сохранить файл."
    return NextResponse.json({ error: `${prefix}${detail}`, uploaded }, { status: 500 })
  }

  return NextResponse.json(uploaded.length === 1 ? uploaded[0] : uploaded)
}
