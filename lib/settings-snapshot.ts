/**
 * Snapshot settings keys → mutate → restore (even on throw).
 * Shared by e2e helpers and smoke scripts — keeps live Turso clean.
 * Relative imports only (Playwright workers do not resolve `@/`).
 */
import { eq, inArray } from "drizzle-orm"
import { ensureDb } from "./db/init"
import { db } from "./db"
import { settings } from "./db/schema"

export async function withSettingsSnapshot<T>(
  keys: string[],
  fn: (ctx: {
    get: (key: string) => string | null
    set: (key: string, value: string) => Promise<void>
  }) => Promise<T>,
): Promise<T> {
  await ensureDb()
  // Один батч-SELECT вместo запроса на каждый ключ (N+1).
  const snap = new Map<string, string | null>()
  const rows = keys.length ? await db.select().from(settings).where(inArray(settings.key, keys)) : []
  const byKey = new Map(rows.map((r) => [r.key, r.value]))
  for (const key of keys) {
    snap.set(key, byKey.get(key) ?? null)
  }

  async function set(key: string, value: string) {
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } })
  }

  try {
    return await fn({
      get: (key) => snap.get(key) ?? null,
      set,
    })
  } finally {
    for (const [key, prev] of snap) {
      if (prev === null) {
        await db.delete(settings).where(eq(settings.key, key))
      } else {
        await set(key, prev)
      }
    }
  }
}
