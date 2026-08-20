/**
 * Media folders: filter SQL + create/list/assign/delete (DB).
 * Run: npx tsx scripts/media-folders.selfcheck.ts
 */
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { ensureDb } from "@/lib/db/init"
import { mediaFiles } from "@/lib/db/schema"
import {
  folderFilterSql,
  normalizeFolderName,
  buildFolderTree,
  flattenFolderTree,
  folderPath,
  collectDescendantIds,
} from "@/lib/media/folders"
import {
  createMediaFolder,
  deleteMediaFolder,
  listMediaFolders,
} from "@/lib/media/folder-service"
import { mediaService } from "@/lib/media/service"
import { uploadFolderId } from "@/lib/media"

assert.equal(normalizeFolderName("  Tours  "), "Tours")
assert.equal(normalizeFolderName(""), null)
assert.equal(normalizeFolderName("x".repeat(81)), null)

assert.equal(folderFilterSql("all"), null)
assert.equal(folderFilterSql(undefined), null)
assert.deepEqual(folderFilterSql("root"), { sql: "folder_id IS NULL", args: [] })
assert.deepEqual(folderFilterSql("abc"), { sql: "folder_id = ?", args: ["abc"] })

assert.equal(uploadFolderId("all"), null)
assert.equal(uploadFolderId("root"), null)
assert.equal(uploadFolderId("folder-1"), "folder-1")

// Вложенные папки: дерево, плоский обход, путь, потомки.
{
  const flat = [
    { id: "a", name: "A", parentId: null, createdAt: 1 },
    { id: "b", name: "B", parentId: "a", createdAt: 2 },
    { id: "c", name: "C", parentId: "b", createdAt: 3 },
    { id: "d", name: "D", parentId: null, createdAt: 4 },
  ]
  const tree = buildFolderTree(flat)
  assert.equal(tree.length, 2) // A, D в корне
  const walked = flattenFolderTree(tree).map((n) => `${n.id}:${n.depth}`)
  assert.deepEqual(walked, ["a:0", "b:1", "c:2", "d:0"])
  assert.deepEqual(folderPath(flat, "c").map((f) => f.id), ["a", "b", "c"])
  assert.deepEqual(collectDescendantIds(flat, "a").sort(), ["b", "c"])
  assert.deepEqual(collectDescendantIds(flat, "d"), [])
  // Сирота (родитель отсутствует) поднимается в корень.
  const orphanTree = buildFolderTree([{ id: "x", name: "X", parentId: "missing", createdAt: 1 }])
  assert.equal(orphanTree.length, 1)
  assert.equal(orphanTree[0].id, "x")
}

async function main() {
  await ensureDb()

  const stamp = Date.now()
  const folder = await createMediaFolder(`selfcheck-folders-${stamp}`)
  const folders = await listMediaFolders()
  assert.ok(folders.some((item) => item.id === folder.id))

  // Вложенная папка внутри созданной.
  const sub = await createMediaFolder(`selfcheck-sub-${stamp}`, folder.id)
  assert.equal(sub.parentId, folder.id)

  // Одинаковое имя в разных родителях допустимо; в одном — нет.
  await createMediaFolder(`selfcheck-dup-${stamp}`, folder.id)
  await createMediaFolder(`selfcheck-dup-${stamp}`, sub.id) // ок: другой родитель
  await assert.rejects(() => createMediaFolder(`selfcheck-dup-${stamp}`, folder.id))

  const fileId = randomUUID()
  await db.insert(mediaFiles).values({
    id: fileId,
    url: `/uploads/selfcheck-folders-${stamp}.jpg`,
    name: `selfcheck-folders-${stamp}.jpg`,
    // size хранится строкой из байтов (CHECK media_files_size_numeric требует цифры).
    size: "1024",
    type: "image",
    checksum: `selfcheck${stamp}`,
    folderId: sub.id,
    createdAt: stamp,
  })

  const inFolder = await mediaService.getAllMedia({ folder: sub.id })
  assert.ok(inFolder.some((item) => item.id === fileId))

  const rootOnly = await mediaService.getAllMedia({ folder: "root" })
  assert.ok(!rootOnly.some((item) => item.id === fileId))

  const moved = await mediaService.updateFolder(fileId, null)
  assert.equal(moved?.folderId, null)

  // Рекурсивное удаление: удаляем корневую — подпапки исчезают тоже.
  const deleted = await deleteMediaFolder(folder.id)
  assert.equal(deleted, true)
  const after = await listMediaFolders()
  assert.ok(!after.some((item) => item.id === folder.id))
  assert.ok(!after.some((item) => item.id === sub.id))

  await db.delete(mediaFiles).where(eq(mediaFiles.id, fileId))

  console.log("media-folders.selfcheck: ok")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
