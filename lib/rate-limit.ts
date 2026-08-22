import "server-only"

/**
 * In-memory sliding-window rate limiter for a single long-lived Node process (pm2).
 *
 * - Один общий Map на процесс, ключи вида "<bucket>:<ip>".
 * - Просроченные записи удаляются лениво при обращении И периодически фоновым
 *   sweep'ом — Map не растёт бесконечно (раньше записи копились навсегда).
 * - При работе за nginx клиентский IP берётся из X-Real-IP / первого значения
 *   X-Forwarded-For, который выставляет ДОВЕРЕННЫЙ прокси (см. ops/nginx/bastur.conf).
 */

type RateEntry = { count: number; resetAt: number }

type RateGlobals = {
  __bustourRateStore?: Map<string, RateEntry>
  __bustourRateSweeper?: ReturnType<typeof setInterval>
}

const g = globalThis as typeof globalThis & RateGlobals

const SWEEP_INTERVAL_MS = 5 * 60_000 // clean expired entries every 5 minutes

function getStore(): Map<string, RateEntry> {
  if (!g.__bustourRateStore) {
    g.__bustourRateStore = new Map()
  }
  if (!g.__bustourRateSweeper) {
    g.__bustourRateSweeper = setInterval(() => {
      const now = Date.now()
      const store = g.__bustourRateStore
      if (!store) return
      for (const [key, entry] of store) {
        if (now > entry.resetAt) store.delete(key)
      }
    }, SWEEP_INTERVAL_MS)
    // Never keep the process alive just for the sweeper.
    g.__bustourRateSweeper.unref?.()
  }
  return g.__bustourRateStore
}

export type RateLimitResult = {
  ok: boolean
  /** Seconds until the window resets — useful for Retry-After. */
  retryAfterSec: number
}

/**
 * Consumes one attempt from the bucket. Returns ok=false when the limit is exceeded.
 *
 * @param bucket  logical namespace, e.g. "lead" | "review" | "login"
 * @param key     client identity (usually IP)
 * @param max     max attempts per window
 * @param windowMs window size in ms
 */
export function consumeRateLimit(bucket: string, key: string, max: number, windowMs: number): RateLimitResult {
  const store = getStore()
  const mapKey = `${bucket}:${key}`
  const now = Date.now()
  const entry = store.get(mapKey)

  if (!entry || now > entry.resetAt) {
    store.set(mapKey, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfterSec: Math.ceil(windowMs / 1000) }
  }

  entry.count++
  const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
  return { ok: entry.count <= max, retryAfterSec }
}

/** Clears attempts for the key (e.g. after a successful login). */
export function resetRateLimit(bucket: string, key: string): void {
  getStore().delete(`${bucket}:${key}`)
}

/**
 * Стойкий (переживающий рестарты) rate-limit на таблице rate_limits.
 *
 * In-memory вариант выше обнуляется при каждом рестарте pm2 — а автодеплой
 * рестартует процесс на каждый пуш в main, т.е. счётчики брутфорса логина
 * жили минуты. Для security-критичных бакетов (login) используем БД:
 * атомарный UPSERT, окно сбрасывается по resetAt.
 *
 * Ошибка БД не должна ронять форму логина — фолбэк на in-memory лимит.
 */
export async function consumePersistentRateLimit(
  bucket: string,
  key: string,
  max: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const mapKey = `${bucket}:${key}`
  const now = Date.now()
  try {
    // Ленивая загрузка, чтобы не тянуть drizzle в лёгкие импорты rate-limit.
    const [{ db }, { rateLimits }, { sql }] = await Promise.all([
      import("@/lib/db"),
      import("@/lib/db/schema"),
      import("drizzle-orm"),
    ])
    const rows = await db
      .insert(rateLimits)
      .values({ key: mapKey, count: 1, resetAt: now + windowMs })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: {
          // Окно истекло — начинаем заново, иначе инкремент.
          count: sql`CASE WHEN ${rateLimits.resetAt} < ${now} THEN 1 ELSE ${rateLimits.count} + 1 END`,
          resetAt: sql`CASE WHEN ${rateLimits.resetAt} < ${now} THEN ${now + windowMs} ELSE ${rateLimits.resetAt} END`,
        },
      })
      .returning({ count: rateLimits.count, resetAt: rateLimits.resetAt })
    const row = rows[0]!
    // Ленивая уборка: изредка чистим давно истёкшие ключи, чтобы таблица
    // не росла бесконечно (аналог фонового sweep'а in-memory стора).
    if (Math.random() < 0.02) {
      const { lt } = await import("drizzle-orm")
      void db
        .delete(rateLimits)
        .where(lt(rateLimits.resetAt, now - windowMs))
        .catch(() => {})
    }
    const retryAfterSec = Math.max(1, Math.ceil((row.resetAt - now) / 1000))
    return { ok: row.count <= max, retryAfterSec }
  } catch {
    return consumeRateLimit(bucket, key, max, windowMs)
  }
}

/** Сброс стойкого лимита (после успешного логина). */
export async function resetPersistentRateLimit(bucket: string, key: string): Promise<void> {
  resetRateLimit(bucket, key)
  try {
    const [{ db }, { rateLimits }, { eq }] = await Promise.all([
      import("@/lib/db"),
      import("@/lib/db/schema"),
      import("drizzle-orm"),
    ])
    await db.delete(rateLimits).where(eq(rateLimits.key, `${bucket}:${key}`))
  } catch {
    // БД недоступна — in-memory сброс уже сделан.
  }
}

/**
 * Extracts the client IP from request headers.
 * Behind nginx the first X-Forwarded-For hop is set by the trusted proxy.
 */
export function clientIpFromHeaders(headers: Headers): string {
  const realIp = headers.get("x-real-ip")?.trim()
  if (realIp) return realIp
  const fwd = headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return fwd || "unknown"
}
