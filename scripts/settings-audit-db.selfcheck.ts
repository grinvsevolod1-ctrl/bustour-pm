/**
 * Requires DATABASE_URL. DB smoke: settings audit helpers + writeAudit insert.
 * Run: npx tsx scripts/settings-audit-db.selfcheck.ts
 */
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import {
  writeAudit,
  listAuditLogs,
  pickSettingsSubset,
  changedSettings,
  settingsAuditEntity,
} from "@/lib/admin-audit"
import { getSettings, saveSettings } from "@/lib/cms"

function loadEnv() {
  // Файл опционален: на сервере DATABASE_URL уже в окружении, в песочнице —
  // .env.development.local. Жёсткий readFileSync валил selfcheck без .env.local.
  const envFile = [".env.local", ".env.development.local", ".env"].find((f) => existsSync(f))
  if (!envFile) return
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith("#")) continue
    const i = t.indexOf("=")
    if (i < 0) continue
    let k = t.slice(0, i)
    let v = t.slice(i + 1)
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1)
    }
    process.env[k] = v
  }
}

async function main() {
  loadEnv()
  // Без PostgreSQL этот DB-smoke пропускается (тот же контракт, что и в
  // других runtime-selfcheck'ах через scripts/lib/selfcheck-db).
  if (!/^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL || "")) {
    console.log("settings-audit-db.selfcheck: skipped — requires a PostgreSQL DATABASE_URL")
    return
  }
  const key = "hot.h1"
  const current = await getSettings()
  const original = current[key] ?? ""
  const marker = `${original} ·audit-selfcheck`
  const beforeFull = pickSettingsSubset(current, [key])
  const entries = { [key]: marker }
  await saveSettings(entries)
  const diff = changedSettings(beforeFull, entries)
  assert.ok(Object.keys(diff.after).length === 1, "diff must see change")
  const entity = settingsAuditEntity(Object.keys(diff.after))
  assert.equal(entity.entityId, "hot")
  await writeAudit({
    admin: { id: 0, username: "selfcheck" },
    action: "settings_update",
    entityType: entity.entityType,
    entityId: entity.entityId,
    summary: `Обновлена страница «${entity.pageKey}» (selfcheck)`,
    before: diff.before,
    after: diff.after,
  })
  await saveSettings({ [key]: original })

  const rows = await listAuditLogs({ action: "settings_update", entityType: "page", limit: 20 })
  const hit = rows.find((r) => r.summary.includes("selfcheck") && r.entityId === "hot")
  assert.ok(hit, "audit row for hot settings_update missing")
  console.log("settings-audit-db.selfcheck ok id=", hit!.id)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
