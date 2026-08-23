import { ALERT_KIND_OPTIONS } from "@/lib/alert-kind"
import type { SettingField, SettingsGroup } from "@/lib/admin-config-types"

/**
 * DRY-хелперы построения полей настроек, выделенные из lib/admin-config.ts.
 * Здесь только функции-фабрики полей/групп, переиспользуемые в статических
 * конфигах (admin-config.ts) и фабриках страниц (admin-page-configs.ts).
 * lib/admin-config.ts реэкспортирует всё отсюда — импорты менять не нужно.
 */

/** DRY page alert pair: `{prefix}.alertText` + `{prefix}.alertType`. Empty prefix → bare keys. */
export function pageAlertFields(prefix: string): SettingField[] {
  const p = prefix ? `${prefix}.` : ""
  return [
    {
      key: `${p}alertText`,
      label: "Алерт страницы",
      type: "shortcode-textarea-multiline",
      rows: 2,
      hint: "Оставьте пустым, чтобы скрыть.",
    },
    {
      key: `${p}alertType`,
      label: "Тип алерта",
      type: "select",
      defaultValue: "info",
      options: ALERT_KIND_OPTIONS,
    },
  ]
}

/** Shared copy for CMS + tour/article SEO forms (keep in sync with selfcheck). */
export const SEO_META_DESCRIPTION_LABEL = "Описание для поиска"
export const SEO_META_DESCRIPTION_HINT =
  "Текст под заголовком в Google и других поисковиках. Можно чуть длиннее. Если превью пустое — это же описание уйдёт и в карточку при шаринге."
export const SEO_META_SHORT_DESC_LABEL = "Превью описание"
export const SEO_META_SHORT_DESC_HINT =
  "Короткий текст для Telegram, VK, WhatsApp, Facebook. Если заполнено — оно важнее «описания для поиска» в публичном meta/OG."

/** DRY SEO pair: `{prefix}.metaDescription` + `{prefix}.metaShortDesc`. Empty prefix → bare keys. */
export function seoPreviewDescriptionFields(
  prefix: string,
  opts?: { required?: boolean; descriptionPlaceholder?: string },
): SettingField[] {
  const p = prefix ? `${prefix}.` : ""
  return [
    {
      key: `${p}metaDescription`,
      label: SEO_META_DESCRIPTION_LABEL,
      type: "shortcode-textarea-multiline",
      rows: 3,
      hint: SEO_META_DESCRIPTION_HINT,
      required: opts?.required,
      placeholder: opts?.descriptionPlaceholder,
    },
    {
      key: `${p}metaShortDesc`,
      label: SEO_META_SHORT_DESC_LABEL,
      type: "shortcode-textarea-multiline",
      rows: 2,
      hint: SEO_META_SHORT_DESC_HINT,
      required: opts?.required,
    },
  ]
}

/** Page header block: title + intro only (no photo). */
export function pageHeaderFields(
  prefix: string,
  opts?: { titleKey?: string; introType?: "textarea" | "richtext"; introRows?: number },
): SettingField[] {
  const titleKey = opts?.titleKey ?? "h1"
  return [
    { key: `${prefix}.${titleKey}`, label: "Заголовок", type: "shortcode-input" },
    {
      key: `${prefix}.intro`,
      label: "Вводный абзац",
      type: opts?.introType ?? "richtext",
      rows: opts?.introRows ?? 5,
    },
  ]
}

export function pageHeaderGroup(
  prefix: string,
  opts?: { titleKey?: string; introType?: "textarea" | "richtext"; introRows?: number },
): SettingsGroup {
  return {
    heading: "Шапка страницы",
    fields: pageHeaderFields(prefix, opts),
  }
}

/** Title + rows/pagination for «Карточки курортов». */
export function citiesCardsFields(
  prefix: string,
  opts?: { titlePlaceholder?: string; titleHint?: string; titleLabel?: string },
): SettingField[] {
  return [
    {
      key: `${prefix}.citiesTitle`,
      label: opts?.titleLabel ?? "Заголовок секции (H2)",
      type: "shortcode-input",
      placeholder: opts?.titlePlaceholder,
      hint: opts?.titleHint,
    },
    {
      key: `${prefix}.cities.rows`,
      label: "Рядов на странице",
      type: "select",
      defaultValue: "2",
      options: [
        { value: "1", label: "1 ряд" },
        { value: "2", label: "2 ряда" },
      ],
      hint: "Сколько рядов показывать до перелистывания (при включённой пагинации).",
    },
    {
      key: `${prefix}.cities.paginate`,
      label: "Пагинация карточек",
      type: "select",
      defaultValue: "1",
      options: [
        { value: "1", label: "Включена — листать страницы" },
        { value: "0", label: "Выключена — показать все" },
      ],
    },
  ]
}

/** Title, description and defaults for the «Filter + search results» listing section
 *  (shared by bustours / aviatory / hot main pages + country / city pages). */
export function searchSectionFields(
  prefix: string,
  opts?: {
    titlePlaceholder?: string
    titleHint?: string
    descriptionPlaceholder?: string
    descriptionHint?: string
    category?: "bus" | "avia" | "hot"
  },
): SettingField[] {
  const sortDefaultValue = opts?.category === "bus" ? "nearest" : "default"
  return [
    {
      key: `${prefix}.search.defaultSort`,
      label: "Сортировка по умолчанию",
      type: "select",
      defaultValue: sortDefaultValue,
      options:
        opts?.category === "avia"
          ? [
              { value: "default", label: "По популярности" },
              { value: "priceAsc", label: "Сначала дешёвые" },
              { value: "priceDesc", label: "Сначала дорогие" },
              { value: "nights", label: "По длительности" },
            ]
          : [
              { value: "nearest", label: "По ближайшей дате" },
              { value: "popularity", label: "По популярности" },
              { value: "priceAsc", label: "Сначала дешёвые" },
              { value: "priceDesc", label: "Сначала дорогие" },
              { value: "nights", label: "По длительности" },
            ],
      hint: "Какая сортировка будет выбрана, пока посетитель не переключит сам.",
    },
    {
      key: `${prefix}.search.hideHeading`,
      label: "Скрыть заголовок «Результаты поиска» над карточками",
      type: "select",
      defaultValue: "0",
      options: [
        { value: "0", label: "Показывать (рекомендуется)" },
        { value: "1", label: "Скрыть" },
      ],
      hint: "Если уже есть заголовок секции сверху — под карточками с турами можно его убрать, чтобы не дублировать.",
    },
  ]
}

/** Settings group wrapper for «Фильтр и результаты поиска». */
export function searchSectionGroup(
  prefix: string,
  opts?: {
    titlePlaceholder?: string
    titleHint?: string
    descriptionPlaceholder?: string
    descriptionHint?: string
    category?: "bus" | "avia" | "hot"
    heading?: string
  },
): SettingsGroup {
  return {
    heading: opts?.heading ?? "Секция «Фильтр и результаты поиска»",
    fields: searchSectionFields(prefix, opts),
  }
}

/**
 * Description field for a resort-table section (resorts / resorts2 / resorts3 …).
 * Resort-section TITLES are always derived from the block.title itself
 * (ResortTableBuilder) — override was removed as legacy.
 * Pattern: `${prefix}.resortsDescription{suffix}` only.
 */
export function resortsSectionFields(
  prefix: string,
  opts?: { suffix?: string; descriptionPlaceholder?: string },
): SettingField[] {
  const suffix = opts?.suffix ?? ""
  return [
    {
      key: `${prefix}.resortsDescription${suffix}`,
      label: `Описание под таблицей${suffix ? ` (${suffix})` : ""}`,
      type: "shortcode-textarea-multiline",
      rows: 3,
      placeholder:
        opts?.descriptionPlaceholder ??
        "Сравните цены, даты выездов и длительность в наглядной таблице. Можно отсортировать по колонкам.",
      hint: "Пара предложений, чтобы пользователь понял: что здесь показано и как пользоваться. Пусто — не показывается. Заголовок секции берётся из самого блока таблицы.",
    },
  ]
}
