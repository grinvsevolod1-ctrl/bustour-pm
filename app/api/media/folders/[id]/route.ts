import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { writeAudit } from "@/lib/admin-audit"
import { deleteMediaFolder, renameMediaFolder } from "@/lib/media/folder-service"

export const runtime = "nodejs"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin().catch(() => null)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  let body: { name?: unknown }
  try {
    body = (await request.json()) as { name?: unknown }
  } catch {
    return NextResponse.json({ error: "Некорректный JSON." }, { status: 400 })
  }
  const name = typeof body.name === "string" ? body.name : ""
  try {
    const folder = await renameMediaFolder(id, name)
    if (!folder) return NextResponse.json({ error: "Папка не найдена." }, { status: 404 })
    await writeAudit({
      admin,
      action: "media_folder_rename",
      entityType: "media_folder",
      entityId: folder.id,
      summary: `Папка медиа переименована в «${folder.name}»`,
      after: folder,
    })
    return NextResponse.json(folder)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось переименовать папку."
    const status = /уже существует|Укажите/.test(message) ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin().catch(() => null)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const deleted = await deleteMediaFolder(id)
  if (!deleted) return NextResponse.json({ error: "Папка не найдена." }, { status: 404 })
  await writeAudit({
    admin,
    action: "media_folder_delete",
    entityType: "media_folder",
    entityId: id,
    summary: `Удалена папка медиа #${id}`,
  })
  return NextResponse.json({ ok: true })
}
