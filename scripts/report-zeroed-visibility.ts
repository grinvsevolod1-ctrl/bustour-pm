/**
 * Диагностика после бага «сохранение любой формы обнуляло видимость секций
 * на всех страницах» (глобальный fallback-цикл toggle'ов в saveSettingsAction,
 * исправлен). Скрипт НИЧЕГО не меняет — только выводит все ключи видимости
 * со значением "0", чтобы владелец глазами проверил, какие из них были
 * выключены багом, а какие — намеренно, и включил нужные через админку.
 *
 * Run: npx tsx scripts/report-zeroed-visibility.ts
 */
import { eq } from "drizzle-orm"
import { db } from "../lib/db"
import { settings } from "../lib/db/schema"
import { ensureDb } from "../lib/db/init"

const VISIBILITY_RE = /(^section\.)|(\.visible$)|(\.section\.[^.]+$)|(\.callus$)|(\.faq$)/

async function main() {
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
  console.log(`Найдено ${zeroed.length} выключенных ключей видимости.`)
  console.log("Проверьте каждый: если секция должна быть видимой — включите её в админке")
  console.log("(теперь состояние не будет слетать при сохранении других форм).\n")
  for (const key of zeroed) console.log(`  ${key}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
