/**
 * Контракт нормализации тогглов в saveSettingsAction.
 *
 * Новый контракт (после фикса «блоки сами отключаются»):
 * 1. Выключенные чекбоксы → "0" ТОЛЬКО для ключей, объявленных формой в __toggles
 *    (lib/settings-toggles.ts / normalizeDeclaredToggles).
 * 2. Глобального fallback-цикла по всем ключам видимости из БД БЫТЬ НЕ ДОЛЖНО:
 *    он обнулял видимость секций на всех страницах при сохранении любой формы.
 * Run: npx tsx scripts/settings-toggles-off-to-zero.selfcheck.ts
 */
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { normalizeDeclaredToggles, parseDeclaredToggles } from "../lib/settings-toggles"

async function main() {
  const root = path.resolve(__dirname, "..")
  const actionsSrc = fs.readFileSync(path.join(root, "app", "admin", "cms-actions.ts"), "utf8")

  // 1. Экшен использует единую утилиту нормализации объявленных тогглов.
  assert.ok(
    actionsSrc.includes("normalizeDeclaredToggles") && actionsSrc.includes("parseDeclaredToggles"),
    "saveSettingsAction должен нормализовать тогглы через lib/settings-toggles",
  )
  assert.ok(actionsSrc.includes("__toggles"), "__toggles читается из formData")

  // 2. РЕГРЕССИЯ: глобальный fallback по всем ключам видимости из БД удалён.
  assert.ok(
    !actionsSrc.includes("toggleKeysFromCurrent"),
    "глобальный fallback-цикл toggleKeysFromCurrent должен быть удалён (обнулял чужие страницы)",
  )

  // 3. Поведение утилиты: выключено → "0" только для объявленных ключей.
  const out = normalizeDeclaredToggles(
    parseDeclaredToggles("home.section.hero,home.notify"),
    (key) => key === "home.section.hero",
    new Set(),
  )
  assert.deepEqual(out, { "home.section.hero": "1", "home.notify": "0" })

  // 4. Не объявлено формой — не сохраняется вовсе (чужие страницы не трогаем).
  assert.deepEqual(normalizeDeclaredToggles(parseDeclaredToggles(""), () => false, new Set()), {})

  console.log("OK — declared-only toggles 1/0; global visibility fallback removed")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
