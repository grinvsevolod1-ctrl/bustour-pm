"use server"

// Server actions автобусов — вынесены из app/admin/actions.ts (#рефакторинг):
// файлы с "use server" не могут реэкспортировать, поэтому импортируй отсюда напрямую.

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireAdmin, requireCapability } from "@/lib/auth"
import { writeAudit } from "@/lib/admin-audit"
import { isRedirectError, mutateThenRedirect } from "@/lib/admin-redirect"
import {
  createBus,
  updateBus,
  moveBus,
  deleteBus,
  restoreBus,
  purgeBus,
  getBusById,
  getBus,
  type BusInput,
} from "@/lib/queries"
import { saveSettings } from "@/lib/cms"
import { rekeyPageScopedContent } from "@/lib/page-rekey"
import { mapDbError } from "@/lib/db-errors"
import { db } from "@/lib/db"
import { busSaveSchema, zodFirstError } from "@/lib/validations/admin"
import { parseGallery, parseDocuments } from "./form-parsers"

function busFromForm(formData: FormData): BusInput {
  return {
    slug: String(formData.get("slug") || "").trim(),
    title: String(formData.get("title") || "").trim(),
    image: String(formData.get("image") || "").trim(),
    gallery: parseGallery(formData.get("gallery")),
    year: String(formData.get("year") || "").trim(),
    seats: String(formData.get("seats") || "").trim(),
    busClass: String(formData.get("busClass") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    documents: parseDocuments(formData.get("documents")),
    seating: parseDocuments(formData.get("seating")),
  }
}

export async function saveBusAction(_prev: unknown, formData: FormData) {
  const admin = await requireAdmin()
  const input = busFromForm(formData)
  const validated = busSaveSchema.safeParse(input)
  if (!validated.success) return { error: zodFirstError(validated.error) }

  const id = Number(formData.get("id") || 0)
  const existing = id ? await getBusById(id) : undefined
  if (id && !existing) return { error: "Автобус не найден" }

  const conflict = await getBus(input.slug)
  if (conflict && conflict.id !== id) {
    return { error: `Автобус со slug «${input.slug}» уже существует — укажите другой slug` }
  }
  let newId = 0
  try {
    if (id) {
      await db.transaction(async (tx) => {
        if (existing && existing.slug !== input.slug) {
          await rekeyPageScopedContent(`bus:${existing.slug}`, `bus:${input.slug}`, tx)
        }
        await updateBus(id, input, tx)
      })
      await writeAudit({
        admin,
        action: "bus_update",
        entityType: "bus",
        entityId: id,
        summary: `Обновлён автобус «${input.title}»`,
        after: { id, ...input },
      })
    } else {
      newId = await db.transaction(async (tx) => {
        const created = await createBus(input, tx)
        await saveSettings(
          {
            [`bus:${input.slug}.visible`]: "0",
            [`bus:${input.slug}.section.callus`]: "0",
          },
          tx,
        )
        return created
      })
      await writeAudit({
        admin,
        action: "bus_create",
        entityType: "bus",
        entityId: newId,
        summary: `Создан автобус «${input.title}»`,
        after: { id: newId, ...input },
      })
    }
  } catch (err) {
    if (isRedirectError(err)) throw err
    return { error: mapDbError(err, "Не удалось сохранить автобус") }
  }

  revalidatePath("/admin/buses")
  revalidatePath("/arenda-avtobusov-v-minske")
  revalidatePath(`/arenda-avtobusov-v-minske/${input.slug}`)
  if (existing && existing.slug !== input.slug) {
    revalidatePath(`/arenda-avtobusov-v-minske/${existing.slug}`)
  }
  // redirect() throws — must stay outside try/catch (same as tours / #55 reviews)
  if (!id) redirect(`/admin/buses/${newId}`)
  return { success: true }
}

export async function moveBusAction(formData: FormData) {
  const admin = await requireAdmin()
  const id = Number(formData.get("id") || 0)
  const direction = String(formData.get("direction") || "up") === "down" ? "down" : "up"
  if (id) await moveBus(id, direction)
  const bus = id ? await getBusById(id) : undefined
  await writeAudit({
    admin,
    action: "bus_move",
    entityType: "bus",
    entityId: id,
    summary: bus
      ? `Перемещён автобус «${bus.title}» (${direction})`
      : `Перемещён автобус #${id} (${direction})`,
    after: { direction },
  })
  revalidatePath("/admin/buses")
  revalidatePath("/arenda-avtobusov-v-minske")
}

export async function deleteBusAction(formData: FormData) {
  const admin = await requireAdmin()
  const id = Number(formData.get("id") || 0)
  return mutateThenRedirect(
    async () => {
      if (!id) return
      const before = await getBusById(id)
      await deleteBus(id)
      await writeAudit({
        admin,
        action: "bus_archive",
        entityType: "bus",
        entityId: id,
        summary: before ? `В архив: автобус «${before.title}»` : `В архив автобус #${id}`,
      })
      revalidatePath("/admin/buses")
      revalidatePath("/admin/archive")
      revalidatePath("/arenda-avtobusov-v-minske")
    },
    "/admin/buses?notice=archived",
    "/admin/buses",
  )
}

export async function restoreBusAction(formData: FormData) {
  const admin = await requireAdmin()
  const id = Number(formData.get("id") || 0)
  return mutateThenRedirect(
    async () => {
      if (id) await restoreBus(id)
      await writeAudit({
        admin,
        action: "bus_restore",
        entityType: "bus",
        entityId: id,
        summary: `Восстановлен автобус #${id}`,
      })
      revalidatePath("/admin/buses")
      revalidatePath("/admin/archive")
      revalidatePath("/arenda-avtobusov-v-minske")
    },
    "/admin/archive?notice=restored",
    "/admin/archive",
  )
}

export async function purgeBusAction(formData: FormData) {
  const admin = await requireCapability("purge")
  const id = Number(formData.get("id") || 0)
  return mutateThenRedirect(
    async () => {
      if (id) await purgeBus(id)
      await writeAudit({
        admin,
        action: "bus_purge",
        entityType: "bus",
        entityId: id,
        summary: `Удалён автобус #${id}`,
      })
      revalidatePath("/admin/buses")
      revalidatePath("/admin/archive")
      revalidatePath("/arenda-avtobusov-v-minske")
    },
    "/admin/archive?notice=purged",
    "/admin/archive",
  )
}
