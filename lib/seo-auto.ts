/**
 * Авто-SEO: чистая логика вычисления автоматических meta-значений из контента
 * страницы. Используется вкладкой «SEO» в редакторах админки (SERP-превью,
 * кнопка «Заполнить из контента») и тестами. Публичный сайт применяет свои
 * fallback'и в buildMetadata / metadataFromSettings — здесь мы лишь показываем
 * админу, что увидит поисковик, и помогаем заполнить поля.
 */

export const SEO_META_HEADING = "SEO и мета"
export const SEO_BRAND = "БасТур"
export const SEO_TITLE_MAX = 60
export const SEO_DESCRIPTION_MAX = 160

/** Убирает HTML-теги и схлопывает пробелы. Для richtext-интро (TipTap HTML). */
export function stripHtmlToText(html: string): string {
  if (!html) return ""
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|blockquote|tr)>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Обрезка по границе слова с многоточием. Согласована с clampMetaTitle /
 * clampMetaDescription (lib/seo-metadata.ts): максимум включает многоточие.
 */
export function truncateForMeta(text: string, max: number): string {
  const t = text.trim()
  if (t.length <= max) return t
  const slice = t.slice(0, max - 1)
  // Не рвать слово посередине: откатываемся к последнему пробелу,
  // если он не слишком далеко (иначе слово длиннее половины лимита).
  const lastSpace = slice.lastIndexOf(" ")
  const cut = lastSpace > max / 2 ? slice.slice(0, lastSpace) : slice
  return `${cut.trimEnd()}…`
}

/** Авто-title: «{H1} — БасТур», обрезка до 60. Пустой источник → "". */
export function buildAutoTitle(source: string, brand: string = SEO_BRAND, max: number = SEO_TITLE_MAX): string {
  const text = stripHtmlToText(source)
  if (!text) return ""
  const suffix = ` — ${brand}`
  // Если сам заголовок с брендом не влезает — обрезаем заголовок, бренд сохраняем.
  if (text.length + suffix.length <= max) return `${text}${suffix}`
  const budget = max - suffix.length
  if (budget < 12) return truncateForMeta(text, max)
  return `${truncateForMeta(text, budget)}${suffix}`
}

/** Авто-description: интро страницы → чистый текст → 160 символов. */
export function buildAutoDescription(source: string, max: number = SEO_DESCRIPTION_MAX): string {
  const text = stripHtmlToText(source)
  if (!text) return ""
  return truncateForMeta(text, max)
}

export type SeoSourceKeys = {
  /** Ключ настройки-источника заголовка (H1 страницы). */
  titleKey?: string
  /** Ключ настройки-источника описания (вводный абзац). */
  descriptionKey?: string
}

type FieldLike = { key: string }
type GroupLike = { heading: string; fields: FieldLike[] }

const TITLE_SOURCE_SUFFIXES = [".h1", ".heroTitle", ".pageTitle", ".title", ".name"]
const DESCRIPTION_SOURCE_SUFFIXES = [".intro", ".subtitle", ".lead", ".heroText", ".description"]

function isMetaKey(key: string): boolean {
  const last = key.split(".").pop() ?? ""
  return /^meta/i.test(last) || /^seo/i.test(last)
}

/**
 * Эвристика: по группам конфига страницы находит ключи-источники для
 * авто-SEO (заголовок и интро), пропуская саму группу «SEO и мета» и любые
 * поля с префиксами meta/seo. Первое совпадение по приоритету суффиксов выигрывает.
 */
export function deriveSeoSourceKeys(groups: GroupLike[]): SeoSourceKeys {
  const candidates = groups
    .filter((group) => group.heading !== SEO_META_HEADING)
    .flatMap((group) => group.fields.map((field) => field.key))
    .filter((key) => !isMetaKey(key))

  const findBySuffix = (suffixes: string[]): string | undefined => {
    for (const suffix of suffixes) {
      const match = candidates.find((key) => key.endsWith(suffix))
      if (match) return match
    }
    return undefined
  }

  return {
    titleKey: findBySuffix(TITLE_SOURCE_SUFFIXES),
    descriptionKey: findBySuffix(DESCRIPTION_SOURCE_SUFFIXES),
  }
}

/** Зона длины для счётчиков: ok (зелёный) / warn (жёлтый) / over (красный). */
export function metaLengthZone(length: number, max: number): "ok" | "warn" | "over" {
  if (length > max) return "over"
  if (length > max * 0.9) return "warn"
  return "ok"
}
