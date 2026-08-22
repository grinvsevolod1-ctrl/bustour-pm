import "server-only"

/**
 * Автоматическое обновление курсов валют с сайта НБРБ.
 *
 * Запускается из instrumentation.ts при старте сервера (pm2 / next start):
 *  - первый прогон через минуту после старта (даём серверу прогреться);
 *  - далее каждые REFRESH_INTERVAL_HOURS часов;
 *  - обновляет только если данные устарели (замер по last refresh в settings),
 *    так что рестарты pm2 не спамят НБРБ запросами.
 *
 * Ручное обновление из админки (валюты → «Обновить с НБРБ») продолжает работать
 * и использует ту же самую refreshCurrenciesFromNbrb — единый код без дублей.
 */

import { refreshCurrenciesFromNbrb, getMarkupPercent } from "@/lib/currencies-server"
import { getSettings, saveSettings } from "@/lib/cms"

const REFRESH_INTERVAL_HOURS = 6
const LAST_REFRESH_KEY = "currencyNbrbLastAutoRefreshAt"

let started = false

async function isStale(): Promise<boolean> {
  try {
    const all = await getSettings()
    const last = all[LAST_REFRESH_KEY]
    if (!last) return true
    const lastMs = Date.parse(last)
    if (!Number.isFinite(lastMs)) return true
    return Date.now() - lastMs > REFRESH_INTERVAL_HOURS * 3600_000
  } catch {
    return true
  }
}

// Advisory-lock id: произвольная константа, уникальная для этой задачи.
const REFRESH_LOCK_ID = 0x6261_7374 // "bast"

async function refreshOnce(reason: string): Promise<void> {
  try {
    if (!(await isStale())) return
    // Лидер-лок через Postgres advisory lock: при pm2 instances > 1 (или во
    // время zero-downtime reload, когда старый и новый процессы живут
    // одновременно) обновление НБРБ выполняет только один процесс.
    const { db } = await import("@/lib/db")
    const { sql } = await import("drizzle-orm")
    const lockRows = await db.execute<{ locked: boolean }>(
      sql`SELECT pg_try_advisory_lock(${REFRESH_LOCK_ID}) AS locked`,
    )
    if (!lockRows.rows[0]?.locked) {
      console.log(`[currency-auto-refresh] ${reason}: другой процесс уже обновляет — пропуск`)
      return
    }
    try {
      // Повторная проверка под локом: пока ждали, лидер мог уже обновить.
      if (!(await isStale())) return
      const markup = await getMarkupPercent()
      const result = await refreshCurrenciesFromNbrb(markup)
      await saveSettings({ [LAST_REFRESH_KEY]: new Date().toISOString() })
      console.log(
        `[currency-auto-refresh] ${reason}: updated=${result.updated} markup=${markup}% asOf=${JSON.stringify(result.asOfDates)}`,
      )
    } finally {
      await db.execute(sql`SELECT pg_advisory_unlock(${REFRESH_LOCK_ID})`).catch(() => {})
    }
  } catch (err) {
    // НБРБ недоступен — не валим сервер, попробуем в следующем цикле
    console.error(`[currency-auto-refresh] ${reason} failed:`, err instanceof Error ? err.message : err)
  }
}

export function startCurrencyAutoRefresh(): void {
  if (started) return
  started = true

  // Первый прогон — через минуту после старта
  const initial = setTimeout(() => void refreshOnce("startup"), 60_000)
  initial.unref?.()

  // Периодический прогон
  const interval = setInterval(() => void refreshOnce("interval"), REFRESH_INTERVAL_HOURS * 3600_000)
  interval.unref?.()
}
