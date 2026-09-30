import { revalidateTag, unstable_cache, updateTag } from "next/cache"

/**
 * Межзапросный кеш публичных выборок (туры, страны, города, отзывы, курсы…).
 *
 * Все публичные страницы — force-dynamic, поэтому без этого слоя каждая
 * из них делала 5–15 SQL-запросов на КАЖДЫЙ просмотр. Кеш держит результаты
 * между запросами; сбрасывается из writeAudit/withAdminAction сразу после
 * любой admin-мутации (см. revalidateSiteData), TTL — страховка на случай
 * мутаций вне request-scope (cron авто-курсов НБРБ, скрипты).
 *
 * Ограничение: кеш Next живёт в памяти процесса. При WEB_INSTANCES>1 (pm2
 * cluster) сброс доходит только до процесса, обработавшего действие админа,
 * остальные обновятся по TTL.
 */
export const SITE_DATA_TAG = "site-data"
export const SITE_DATA_TTL_SECONDS = 300

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- контракт unstable_cache
type Query = (...args: any[]) => Promise<any>

/**
 * Оборачивает read-функцию в unstable_cache с общим тегом. Аргументы вызова
 * автоматически входят в ключ, поэтому НЕ передавай сюда функции, принимающие
 * объёмные объекты (settings) — см. lib/public/cities.ts, как это обходить.
 */
export function cachedPublicQuery<T extends Query>(name: string, fn: T): T {
  return unstable_cache(fn, ["site-data", name], {
    tags: [SITE_DATA_TAG],
    revalidate: SITE_DATA_TTL_SECONDS,
  })
}

/**
 * Сбрасывает кеш публичных данных после admin-мутации.
 * updateTag — read-your-writes (следующий запрос ждёт свежие данные), но
 * доступен только в Server Actions; в route handlers используем
 * revalidateTag(…, "max"). Вне request-scope оба бросают — кеш истечёт по TTL.
 */
export function revalidateSiteData(): void {
  try {
    updateTag(SITE_DATA_TAG)
    return
  } catch {
    // не Server Action — пробуем мягкий сброс
  }
  try {
    revalidateTag(SITE_DATA_TAG, "max")
  } catch {
    // вне request-scope (cron, selfcheck-скрипты) — полагаемся на TTL
  }
}
