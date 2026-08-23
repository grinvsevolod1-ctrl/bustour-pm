/**
 * Восстановление после бага «сохранение любой формы обнуляло видимость секций
 * на всех страницах» (глобальный fallback-цикл toggle'ов в saveSettingsAction,
 * исправлен в lib/settings-toggles.ts + cms-actions).
 *
 * Семантика isOn(): отсутствие ключа = «включено», "0" = «выключено».
 * Поэтому восстановление = УДАЛИТЬ обнулённые ключи (вернётся дефолт
 * «включено»), а не переписывать их в "1" — так не появляется мусорных строк.
 *
 * ВАЖНО: часть "0" могла быть выставлена админом намеренно. Скрипт по
 * умолчанию работает в dry-run и только показывает, что удалит. Применение:
 *   npx tsx scripts/restore-zeroed-visibility.ts --apply
 * После применения намеренно скрытые секции нужно выключить в админке заново
 * (теперь состояние не слетает при сохранении других форм).
 */
import { eq, inArray } from "drizzle-orm"
import { db } from "../lib/db"
import { settings } from "../lib/db/schema"
import { ensureDb } from "../lib/db/init"

const VISIBILITY_RE = /(^section\.)|(\.visible$)|(\.section\.[^.]+$)|(\.callus$)|(\.faq$)/

async function main() {
  const apply = process.argv.includes("--apply")
  await ensureDb()
  const rows = await db
    .select({ key: settings.key, value: settings.value })
    .from(settings)
    .where(eq(settings.value, "0"))

  const zeroed = rows.map((r) => r.key).filter((k) => VISIBILITY_RE.test(k)).sort()

  if (!zeroed.length) {
    console.log("Ключей видимости со значением 0 не найдено — всё включено.")
    return
  }

  console.log(`Найдено ${zeroed.length} выключенных ключей видимости:`)
  for (const key of zeroed) console.log(`  ${key}`)

  if (!apply) {
    console.log("\nDRY-RUN: ничего не изменено. Запустите с --apply, чтобы удалить эти ключи")
    console.log("(секции снова станут видимыми; намеренно скрытые выключите в админке заново).")
    return
  }

  await db.delete(settings).where(inArray(settings.key, zeroed))
  console.log(`\nУдалено ${zeroed.length} ключей — все секции снова видимы.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
