/** Nested media folders CRUD (DB). Pure helpers: `@/lib/media/folders`. */

import { randomUUID } from "node:crypto"
import { and, eq, inArray, isNull } from "drizzle-orm"
import { db, client } from "@/lib/db"
import { ensureDb } from "@/lib/db/init"
import { mediaFolders, mediaFiles } from "@/lib/db/schema"
import {
  normalizeFolderName,
  collectDescendantIds,
  type MediaFolder,
} from "@/lib/media/folders"

export type { MediaFolder }

export async function listMediaFolders(): Promise<MediaFolder[]> {
  await ensureDb()
  const rows = await db
    .select({
      id: mediaFolders.id,
      name: mediaFolders.name,
      parentId: mediaFolders.parentId,
      createdAt: mediaFolders.createdAt,
    })
    .from(mediaFolders)
    .orderBy(mediaFolders.name)
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    parentId: row.parentId ?? null,
    createdAt: row.createdAt,
  }))
}

async function nameTakenInParent(name: string, parentId: string | null): Promise<boolean> {
  const rows = await db
    .select({ id: mediaFolders.id })
    .from(mediaFolders)
    .where(
      parentId == null
        ? and(eq(mediaFolders.name, name), isNull(mediaFolders.parentId))
        : and(eq(mediaFolders.name, name), eq(mediaFolders.parentId, parentId)),
    )
    .limit(1)
  return rows.length > 0
}

export async function createMediaFolder(
  rawName: string,
  parentId: string | null = null,
): Promise<MediaFolder> {
  const name = normalizeFolderName(rawName)
  if (!name) throw new Error("Укажите название папки (1–80 символов).")
  await ensureDb()

  // Родитель должен существовать (если указан).
  if (parentId != null && !(await folderExists(parentId))) {
    throw new Error("Родительская папка не найдена.")
  }

  // Уникальность имени — в пределах одного родителя (глобальный UNIQUE снят миграцией).
  if (await nameTakenInParent(name, parentId)) {
    throw new Error(`Папка «${name}» уже существует в этом расположении.`)
  }

  const id = randomUUID()
  const createdAt = Date.now()
  await db.insert(mediaFolders).values({ id, name, parentId, createdAt })
  return { id, name, parentId, createdAt }
}

export async function renameMediaFolder(id: string, rawName: string): Promise<MediaFolder | null> {
  const name = normalizeFolderName(rawName)
  if (!name) throw new Error("Укажите название папки (1–80 символов).")
  await ensureDb()
  const [existing] = await db
    .select({ id: mediaFolders.id, parentId: mediaFolders.parentId, createdAt: mediaFolders.createdAt })
    .from(mediaFolders)
    .where(eq(mediaFolders.id, id))
    .limit(1)
  if (!existing) return null
  const parentId = existing.parentId ?? null
  const rows = await db
    .select({ id: mediaFolders.id })
    .from(mediaFolders)
    .where(
      parentId == null
        ? and(eq(mediaFolders.name, name), isNull(mediaFolders.parentId))
        : and(eq(mediaFolders.name, name), eq(mediaFolders.parentId, parentId)),
    )
    .limit(1)
  if (rows.length && rows[0].id !== id) {
    throw new Error(`Папка «${name}» уже существует в этом расположении.`)
  }
  await db.update(mediaFolders).set({ name }).where(eq(mediaFolders.id, id))
  return { id, name, parentId, createdAt: existing.createdAt }
}

export async function deleteMediaFolder(id: string): Promise<boolean> {
  await ensureDb()
  const [existing] = await db
    .select({ id: mediaFolders.id })
    .from(mediaFolders)
    .where(eq(mediaFolders.id, id))
    .limit(1)
  if (!existing) return false

  // Собираем саму папку + всех потомков и «отвязываем» их файлы, затем удаляем.
  const all = await listMediaFolders()
  const idsToRemove = [id, ...collectDescendantIds(all, id)]
  await db.update(mediaFiles).set({ folderId: null }).where(inArray(mediaFiles.folderId, idsToRemove))
  // Удаляем от листьев к корню (FK cascade тоже справится, но так надёжнее для всех БД).
  await db.delete(mediaFolders).where(inArray(mediaFolders.id, idsToRemove))
  return true
}

export async function folderExists(id: string): Promise<boolean> {
  await ensureDb()
  const result = await client.execute({
    sql: "SELECT 1 FROM media_folders WHERE id = ? LIMIT 1",
    args: [id],
  })
  return result.rows.length > 0
}
