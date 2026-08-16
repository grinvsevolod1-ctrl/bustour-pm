/**
 * Классификация ключей настроек по области действия.
 *
 * Глобальные (site-wide) пространства ключей — соответствуют группам страницы
 * /admin/settings (settingsGroups в lib/admin-config.ts) + social.links.
 * Право manage_settings выводится из САМИХ ключей, а не из клиентского флага
 * формы: скрытое поле можно подделать в POST, ключи — нет.
 *
 * Вынесено из app/admin/cms-actions.ts ("use server" запрещает экспорт
 * синхронных функций), чтобы логика была покрыта selfcheck-тестом.
 */
export const GLOBAL_SETTINGS_PREFIXES = [
  "site.",
  "analytics.",
  "announcement.",
  "notify.",
  "social.",
] as const

export function isGlobalSettingsKey(key: string): boolean {
  return GLOBAL_SETTINGS_PREFIXES.some((prefix) => key.startsWith(prefix))
}
