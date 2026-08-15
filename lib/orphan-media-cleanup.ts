/**
 * Поиск сирот-медиа: файлы медиатеки, url которых не встречается ни в одном
 * контентном поле БД. Чистая логика без I/O — сборка корпуса и запросы живут
 * в scripts/orphan-media-cleanup.ts и периодическом прогоне media-worker.
 *
 * Аналог lib/orphan-cms-cleanup.ts, но для файлов вместо CMS-ключей.
 */

export type OrphanMediaCandidate = {
  id: string
  url: string
  name: string
  status: string
  createdAt: number
}

export type OrphanMediaReport = {
  orphans: OrphanMediaCandidate[]
  /** Файлы моложе minAgeMs — пропущены (могли только что загрузить и ещё не привязать). */
  skippedTooRecent: number
  /** Файлы в обработке (status != ready) — не трогаем, ими владеет media-worker. */
  skippedProcessing: number
  totalChecked: number
}

/** Сутки/30 дней по умолчанию: файл должен «отлежаться», прежде чем считаться сиротой. */
export const DEFAULT_MIN_AGE_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Файл считается используемым, если его url ИЛИ id встречается в корпусе.
 * id проверяем на случай ссылок вида /api/media/{id} или хранения id в extra.
 */
export function isMediaUsed(candidate: Pick<OrphanMediaCandidate, "id" | "url">, corpus: string): boolean {
  if (!candidate.url) return true // без url судить нельзя — не трогаем
  if (corpus.includes(candidate.url)) return true
  // Вариант без origin: в БД url может храниться относительным или абсолютным.
  try {
    const parsed = new URL(candidate.url, "http://local")
    const pathOnly = parsed.pathname
    if (pathOnly && pathOnly !== "/" && corpus.includes(pathOnly)) return true
  } catch {
    // не-URL значение — сравнили выше как есть
  }
  if (candidate.id && corpus.includes(candidate.id)) return true
  return false
}

export function findOrphanMedia(
  files: OrphanMediaCandidate[],
  corpus: string,
  opts?: { minAgeMs?: number; now?: number },
): OrphanMediaReport {
  const minAgeMs = opts?.minAgeMs ?? DEFAULT_MIN_AGE_MS
  const now = opts?.now ?? Date.now()

  const orphans: OrphanMediaCandidate[] = []
  let skippedTooRecent = 0
  let skippedProcessing = 0

  for (const file of files) {
    if (file.status !== "ready") {
      skippedProcessing++
      continue
    }
    if (now - file.createdAt < minAgeMs) {
      skippedTooRecent++
      continue
    }
    if (!isMediaUsed(file, corpus)) {
      orphans.push(file)
    }
  }

  return { orphans, skippedTooRecent, skippedProcessing, totalChecked: files.length }
}

/**
 * Список «таблица → контентные колонки», в которых могут встречаться ссылки
 * на медиа. При добавлении новых таблиц с картинками/документами — дополнить.
 * Собирается в один текстовый корпус одним запросом на таблицу.
 */
export const MEDIA_CORPUS_SOURCES: ReadonlyArray<{ table: string; columns: readonly string[] }> = [
  { table: "tours", columns: ["image", "gallery", "documents", "program", "layout", "seoHtml", "datesTable"] },
  { table: "buses", columns: ["image", "gallery", "documents", "seating"] },
  { table: "transfers", columns: ["image"] },
  { table: "reviews", columns: ["videoUrl", "thumbnailUrl", "text"] },
  { table: "articles", columns: ["image", "metaImage", "content", "contentHtml", "excerpt"] },
  { table: "staff", columns: ["photo"] },
  { table: "certificates", columns: ["image"] },
  { table: "city_destinations", columns: ["intro", "sections", "seoHtml"] },
  { table: "countries", columns: ["intro", "seoHtml"] },
  { table: "content_blocks", columns: ["image", "body", "extra", "icon", "href"] },
  { table: "settings", columns: ["value"] },
  { table: "shortcodes", columns: ["value"] },
]
