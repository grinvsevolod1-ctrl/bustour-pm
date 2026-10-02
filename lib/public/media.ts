/**
 * Кешируемые варианты выборок медиатеки для ПУБЛИЧНОГО сайта
 * (см. lib/public/queries.ts — тот же принцип: админка читает lib/media/service
 * напрямую, сайт — отсюда).
 *
 * Alt-тексты галереи и подписи «Фото: автор» в rich-контенте раньше ходили в
 * mediaFiles на КАЖДЫЙ рендер страницы тура/автобуса/статьи — по одному запросу
 * на блок RichContent. Теперь результат живёт в межзапросном кеше с тегом
 * site-data и сбрасывается теми же admin-мутациями, что и остальные данные.
 *
 * unstable_cache сериализует результат в JSON, поэтому Map кешируется как
 * массив пар и восстанавливается на выходе.
 */
import * as media from "@/lib/media/service"
import { cachedPublicQuery } from "@/lib/site-data-cache"

type Entries = [string, string][]

const cachedDefaultAlts = cachedPublicQuery("media-default-alts", async (ids: string[]): Promise<Entries> => [
  ...(await media.getDefaultAltsByMediaIds(ids)),
])

const cachedAuthorsByUrls = cachedPublicQuery("media-authors-by-urls", async (urls: string[]): Promise<Entries> => [
  ...(await media.getAuthorsByUrls(urls)),
])

function normalizeKeys(values: string[]): string[] {
  // Стабильный ключ кеша: порядок и дубли в исходном списке не должны плодить записи.
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort()
}

export async function getDefaultAltsByMediaIds(ids: string[]): Promise<Map<string, string>> {
  const keys = normalizeKeys(ids)
  if (!keys.length) return new Map()
  return new Map(await cachedDefaultAlts(keys))
}

export async function getAuthorsByUrls(urls: string[]): Promise<Map<string, string>> {
  const keys = normalizeKeys(urls)
  if (!keys.length) return new Map()
  return new Map(await cachedAuthorsByUrls(keys))
}
