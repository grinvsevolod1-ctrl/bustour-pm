/**
 * Хелперы чтения FormData в server actions — единая замена десяткам
 * повторов `String(formData.get("x") || "").trim()` по всем admin actions.
 * Новые actions пишем через них; старые переводим по мере правок.
 */

/** Строка из FormData: null/undefined → "", всегда trim. */
export function formString(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim()
}

/** Число из FormData: пусто или NaN → fallback (по умолчанию 0). */
export function formNumber(fd: FormData, key: string, fallback = 0): number {
  const raw = formString(fd, key)
  if (!raw) return fallback
  const n = Number(raw.replace(",", "."))
  return Number.isFinite(n) ? n : fallback
}

/** Целое из FormData: пусто, NaN или дробное → fallback. */
export function formInt(fd: FormData, key: string, fallback = 0): number {
  const n = formNumber(fd, key, fallback)
  return Number.isInteger(n) ? n : fallback
}

/** Чекбокс из FormData: "1", "on", "true" → true. */
export function formBool(fd: FormData, key: string): boolean {
  const raw = formString(fd, key).toLowerCase()
  return raw === "1" || raw === "on" || raw === "true"
}

/** Значение из фиксированного набора; иначе fallback. */
export function formEnum<T extends string>(fd: FormData, key: string, allowed: readonly T[], fallback: T): T {
  const raw = formString(fd, key)
  return (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback
}
