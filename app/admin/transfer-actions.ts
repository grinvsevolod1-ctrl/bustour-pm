"use server"

// Server actions трансферов и их расписаний — вынесены из app/admin/actions.ts
// (#рефакторинг): файлы с "use server" не могут реэкспортировать,
// поэтому импортируй отсюда напрямую.

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireAdmin, requireCapability } from "@/lib/auth"
import { writeAudit } from "@/lib/admin-audit"
import { isRedirectError, mutateThenRedirect } from "@/lib/admin-redirect"
import {
  createTransfer,
  updateTransfer,
  moveTransfer,
  deleteTransfer,
  restoreTransfer,
  purgeTransfer,
  getTransferById,
  getTransfer,
  replaceTransferSchedules,
  normalizeTransferScheduleRows,
  type TransferInput,
} from "@/lib/queries"
import { saveSettings } from "@/lib/cms"
import { rekeyPageScopedContent } from "@/lib/page-rekey"
import { mapDbError } from "@/lib/db-errors"
import { db } from "@/lib/db"
import {
  transferSaveSchema,
  transferSchedulesSaveSchema,
  zodFirstError,
} from "@/lib/validations/admin"

function transferFromForm(formData: FormData) {
  const category = String(formData.get("category") || "")
  return {
    slug: String(formData.get("slug") || "").trim(),
    category: category === "individual" ? "individual" : "airport",
    title: String(formData.get("title") || "").trim(),
    intro: String(formData.get("intro") || ""),
    priceRoundTrip: Number(formData.get("priceRoundTrip") || 0),
    priceOneWay: Number(formData.get("priceOneWay") || 0),
    image: String(formData.get("image") || "").trim(),
  }
}

export async function saveTransferAction(_prev: unknown, formData: FormData) {
  const admin = await requireAdmin()
  const validated = transferSaveSchema.safeParse(transferFromForm(formData))
  if (!validated.success) return { error: zodFirstError(validated.error) }
  const input: TransferInput = validated.data
  const id = Number(formData.get("id") || 0)
  try {
    const existing = id ? await getTransferById(id) : undefined
    if (id && !existing) return { error: "Трансфер не найден" }
    const conflict = await getTransfer(input.slug, input.category)
    if (conflict && conflict.id !== id) {
      return { error: `Трансфер со slug «${input.slug}» уже существует в этой категории` }
    }
    if (id) {
      await db.transaction(async (tx) => {
        if (existing && existing.slug !== input.slug) {
          await rekeyPageScopedContent(`transfer:${existing.slug}`, `transfer:${input.slug}`, tx)
        }
        await updateTransfer(id, input, tx)
      })
      await writeAudit({
        admin,
        action: "transfer_update",
        entityType: "transfer",
        entityId: id,
        summary: `Обновлён трансфер «${input.title}»`,
        after: { id, ...input },
      })
    } else {
      let newId = 0
      await db.transaction(async (tx) => {
        newId = await createTransfer(input, tx)
        await saveSettings(
          {
            [`transfer:${input.slug}.visible`]: "0",
            [`transfer:${input.slug}.section.callus`]: "0",
          },
          tx,
        )
      })
      await writeAudit({
        admin,
        action: "transfer_create",
        entityType: "transfer",
        entityId: newId,
        summary: `Создан трансфер «${input.title}»`,
        after: { id: newId, ...input },
      })
      revalidatePath("/admin/transfers")
      redirect(`/admin/transfers/${newId}`)
    }
    revalidatePath("/admin/transfers")
    revalidatePath("/admin/schedules")
    revalidatePath("/helpful/transfers")
    revalidatePath(`/helpful/transfers/${input.slug}`)
    if (existing && existing.slug !== input.slug) revalidatePath(`/helpful/transfers/${existing.slug}`)
    return { success: true }
  } catch (err) {
    if (isRedirectError(err)) throw err
    return { error: mapDbError(err, "Не удалось сохранить трансфер") }
  }
}

export async function moveTransferAction(formData: FormData) {
  const admin = await requireAdmin()
  const id = Number(formData.get("id") || 0)
  const direction = String(formData.get("direction") || "up") === "down" ? "down" : "up"
  if (id) await moveTransfer(id, direction)
  const transfer = id ? await getTransferById(id) : undefined
  await writeAudit({
    admin,
    action: "transfer_move",
    entityType: "transfer",
    entityId: id,
    summary: transfer
      ? `Перемещён трансфер «${transfer.title}» (${direction})`
      : `Перемещён трансфер #${id} (${direction})`,
    after: { direction },
  })
  revalidatePath("/admin/transfers")
  revalidatePath("/helpful/transfers")
}

export async function deleteTransferAction(formData: FormData) {
  const admin = await requireAdmin()
  const id = Number(formData.get("id") || 0)
  return mutateThenRedirect(
    async () => {
      if (!id) return
      const transfer = await getTransferById(id)
      await deleteTransfer(id)
      await writeAudit({
        admin,
        action: "transfer_archive",
        entityType: "transfer",
        entityId: id,
        summary: transfer ? `В архив: трансфер «${transfer.title}»` : `В архив трансфер #${id}`,
      })
      revalidatePath("/admin/transfers")
      revalidatePath("/admin/archive")
      revalidatePath("/admin/schedules")
      revalidatePath("/helpful/transfers")
      if (transfer) revalidatePath(`/helpful/transfers/${transfer.slug}`)
    },
    "/admin/transfers?notice=archived",
    "/admin/transfers",
  )
}

export async function restoreTransferAction(formData: FormData) {
  const admin = await requireAdmin()
  const id = Number(formData.get("id") || 0)
  return mutateThenRedirect(
    async () => {
      if (id) await restoreTransfer(id)
      await writeAudit({
        admin,
        action: "transfer_restore",
        entityType: "transfer",
        entityId: id,
        summary: `Восстановлен трансфер #${id}`,
      })
      revalidatePath("/admin/transfers")
      revalidatePath("/admin/archive")
      revalidatePath("/admin/schedules")
      revalidatePath("/helpful/transfers")
    },
    "/admin/archive?notice=restored",
    "/admin/archive",
  )
}

export async function purgeTransferAction(formData: FormData) {
  const admin = await requireCapability("purge")
  const id = Number(formData.get("id") || 0)
  return mutateThenRedirect(
    async () => {
      if (id) await purgeTransfer(id)
      await writeAudit({
        admin,
        action: "transfer_purge",
        entityType: "transfer",
        entityId: id,
        summary: `Удалён трансфер #${id}`,
      })
      revalidatePath("/admin/transfers")
      revalidatePath("/admin/archive")
      revalidatePath("/admin/schedules")
      revalidatePath("/helpful/transfers")
    },
    "/admin/archive?notice=purged",
    "/admin/archive",
  )
}

export async function saveTransferSchedulesAction(_prev: unknown, formData: FormData) {
  const admin = await requireAdmin()
  const raw = String(formData.get("rows") || "[]")
  let rows: unknown
  try {
    rows = JSON.parse(raw)
  } catch {
    return { error: "Не удалось прочитать строки расписания" }
  }
  const validated = transferSchedulesSaveSchema.safeParse({
    transferId: formData.get("transferId"),
    direction: formData.get("direction"),
    rows: Array.isArray(rows) ? rows : [],
  })
  if (!validated.success) return { error: zodFirstError(validated.error) }
  const { transferId, direction } = validated.data
  const normalized = normalizeTransferScheduleRows(validated.data.rows)
  try {
    await replaceTransferSchedules(transferId, direction, normalized)
    const transfer = await getTransferById(transferId)
    await writeAudit({
      admin,
      action: "transfer_schedules_update",
      entityType: "transfer",
      entityId: transferId,
      summary: transfer
        ? `Обновлено расписание «${transfer.title}» (${direction})`
        : `Обновлено расписание трансфера #${transferId}`,
      after: { direction, rows: normalized },
    })
    revalidatePath("/admin/schedules")
    revalidatePath(`/admin/transfers/${transferId}`)
    if (transfer) revalidatePath(`/helpful/transfers/${transfer.slug}`)
    revalidatePath("/helpful/transfers")
    return { success: true }
  } catch (err) {
    return { error: mapDbError(err, "Не удалось сохранить расписание") }
  }
}
