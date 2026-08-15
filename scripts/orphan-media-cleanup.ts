/**
 * Чистка сирот-медиа: файлы медиатеки, не привязанные ни к одной сущности.
 *
 * Запуск:
 *   npx tsx scripts/orphan-media-cleanup.ts            # dry-run: только отчёт
 *   npx tsx scripts/orphan-media-cleanup.ts --apply    # удалить найденных сирот
 *   npx tsx scripts/orphan-media-cleanup.ts --min-age-days=7
 *
 * Безопасность:
 *  - файлы моложе min-age (по умолчанию 30 дней) не трогаем;
 *  - файлы в обработке (status != ready) не трогаем;
 *  - без --apply ничего не удаляется.
 */
import { client, closeDbPool } from "../lib/db"
import { mediaService } from "../lib/media/service"
import {
  DEFAULT_MIN_AGE_MS,
  findOrphanMedia,
  MEDIA_CORPUS_SOURCES,
  type OrphanMediaCandidate,
} from "../lib/orphan-media-cleanup"

const apply = process.argv.includes("--apply")
const minAgeArg = process.argv.find((a) => a.startsWith("--min-age-days="))
const minAgeMs = minAgeArg ? Number(minAgeArg.split("=")[1]) * 24 * 60 * 60 * 1000 : DEFAULT_MIN_AGE_MS

export async function buildMediaCorpus(): Promise<string> {
  const parts: string[] = []
  for (const source of MEDIA_CORPUS_SOURCES) {
    // Имена таблиц и колонок берутся из константного списка (не из ввода),
    // поэтому интерполяция идентификаторов безопасна.
    const cols = source.columns.map((c) => `coalesce("${c}"::text, '')`).join(" || ' ' || ")
    const { rows } = await client.query(`SELECT ${cols} AS corpus FROM "${source.table}"`)
    for (const row of rows) parts.push(String(row.corpus || ""))
  }
  return parts.join("\n")
}

export async function loadMediaCandidates(): Promise<OrphanMediaCandidate[]> {
  const { rows } = await client.query(
    `SELECT id, url, name, status, created_at AS "createdAt" FROM media_files`,
  )
  return rows.map((r: Record<string, unknown>) => ({
    id: String(r.id),
    url: String(r.url || ""),
    name: String(r.name || ""),
    status: String(r.status || ""),
    createdAt: Number(r.createdAt || 0),
  }))
}

async function main() {
  console.log(`[orphan-media] scan start (apply=${apply}, minAgeDays=${Math.round(minAgeMs / 86_400_000)})`)

  const [corpus, files] = await Promise.all([buildMediaCorpus(), loadMediaCandidates()])
  const report = findOrphanMedia(files, corpus, { minAgeMs })

  console.log(
    `[orphan-media] checked=${report.totalChecked} orphans=${report.orphans.length} ` +
      `skippedRecent=${report.skippedTooRecent} skippedProcessing=${report.skippedProcessing}`,
  )

  for (const orphan of report.orphans) {
    const age = Math.round((Date.now() - orphan.createdAt) / 86_400_000)
    console.log(`  - ${orphan.id} «${orphan.name}» ${orphan.url} (возраст ${age} дн.)`)
  }

  if (!report.orphans.length) {
    console.log("[orphan-media] сирот не найдено")
    return
  }

  if (!apply) {
    console.log("[orphan-media] dry-run: ничего не удалено. Для удаления добавьте --apply")
    return
  }

  let deleted = 0
  for (const orphan of report.orphans) {
    const ok = await mediaService.deleteFile(orphan.id).catch((err: unknown) => {
      console.error(`[orphan-media] не удалось удалить ${orphan.id}:`, (err as Error).message)
      return false
    })
    if (ok) deleted++
  }
  console.log(`[orphan-media] удалено файлов: ${deleted}/${report.orphans.length}`)
}

// Запуск только как CLI (файл также импортируется media-worker'ом).
if (process.argv[1] && process.argv[1].endsWith("orphan-media-cleanup.ts")) {
  main()
    .catch((error) => {
      console.error("[orphan-media] fatal:", error)
      process.exitCode = 1
    })
    .finally(() => closeDbPool().catch(() => {}))
}
