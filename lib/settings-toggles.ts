// Нормализация чекбоксов-тогглов при сохранении настроек CMS (см. cms-actions).
//
// Почему это отдельный модуль: браузер отправляет чекбокс только когда он
// включён, поэтому «выключено» приходится восстанавливать на сервере — но
// ТОЛЬКО для тогглов, которые форма явно объявила своими через скрытое поле
// __toggles. Исторический баг: сервер добирал сюда ключи видимости из всей
// БД (*.visible, *.section.* и т.п.), и сохранение любой формы обнуляло
// секции на всех остальных страницах сайта.

/** Разбирает значение скрытого поля __toggles ("a.b,c.d") в список ключей. */
export function parseDeclaredToggles(raw: unknown): string[] {
  return String(raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Возвращает записи "1"/"0" для объявленных формой тогглов.
 * - Ключи из skipKeys (видимость, уже разобранная из __sectionVisibility)
 *   не трогаем: их источник правды — JSON, а не одноимённый чекбокс.
 * - Ключи, НЕ объявленные в declared, никогда не попадают в результат —
 *   чужие страницы не затрагиваются.
 */
export function normalizeDeclaredToggles(
  declared: string[],
  isChecked: (key: string) => boolean,
  skipKeys: ReadonlySet<string>,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of declared) {
    if (skipKeys.has(key)) continue
    out[key] = isChecked(key) ? "1" : "0"
  }
  return out
}
