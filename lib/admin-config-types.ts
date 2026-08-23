import type { BlockCollection } from "@/lib/types"

/**
 * Типы полей и коллекций админки, выделенные из lib/admin-config.ts.
 * Здесь только объявления типов и реестр коллекций контента — без DRY-хелперов
 * и без статических групп настроек. lib/admin-config.ts реэкспортирует всё отсюда,
 * поэтому существующие импорты из "@/lib/admin-config" менять не нужно.
 */

export type BlockField =
  | "title"
  | "subtitle"
  | "body"
  | "image"
  | "icon"
  | "href"
  | "buttonText"
  | "defaultOpen"
  | "features"

export type CollectionMeta = {
  key: BlockCollection
  label: string // plural, e.g. "Слайды героя"
  singular: string // e.g. "слайд"
  description: string
  fields: BlockField[]
  labels: Partial<Record<BlockField, string>>
  reorderable: boolean
  /** Admin list page; defaults to /admin/content/{key} */
  listPath?: string
}

export const collections: CollectionMeta[] = [
  {
    key: "hero",
    label: "Слайды героя",
    singular: "слайд",
    description: "Баннеры-слайды в верхней части главной страницы.",
    fields: ["title", "subtitle", "image", "href", "buttonText"],
    labels: {
      title: "Заголовок",
      subtitle: "Подзаголовок",
      image: "Фоновое изображение",
      href: "Ссылка кнопки",
      buttonText: "Текст кнопки",
    },
    reorderable: true,
    listPath: "/admin/pages/home",
  },
  {
    key: "advantage",
    label: "Преимущества",
    singular: "преимущество",
    description: "Блок «Почему выбирают нас» на главной.",
    fields: ["title", "body", "icon"],
    labels: { title: "Заголовок", body: "Описание", icon: "Иконка" },
    reorderable: true,
  },
  {
    key: "direction",
    label: "Направления (футер)",
    singular: "направление",
    description: "Список направлений в футере сайта.",
    fields: ["title", "href"],
    labels: { title: "Название", href: "Ссылка" },
    reorderable: true,
  },
  {
    key: "resort",
    label: "Курорты (таблица сравнения)",
    singular: "курорт",
    description: "Строки таблицы сравнения курортов на страницах авиатуров.",
    fields: ["title", "subtitle", "body", "icon"],
    labels: {
      title: "Название курорта",
      subtitle: "Кому подходит",
      body: "Сильные стороны",
      icon: "Возможные нюансы",
    },
    reorderable: true,
  },
]

export function collectionListPath(meta: CollectionMeta): string {
  return meta.listPath ?? `/admin/content/${meta.key}`
}

/** Collections shown on /admin/content hub */
export const contentHubCollections = collections.filter((c) => !c.listPath)

export function getCollection(key: string): CollectionMeta | undefined {
  return collections.find((c) => c.key === key)
}

/* ---------------- Settings groups ---------------- */

export type SettingFieldOption = {
  value: string
  label: string
  /** Visual tone for select options (colored dot). */
  tone?: "info" | "warning" | "error" | "neutral"
}

export type SettingField = {
  key: string
  label: string
  type?: "text" | "textarea" | "shortcode-input" | "shortcode-textarea" | "shortcode-textarea-multiline" | "richtext" | "media" | "select" | "date"
  required?: boolean
  placeholder?: string
  hint?: string
  /** Number of rows for textarea (default 3) */
  rows?: number
  /** Options for type "select" */
  options?: SettingFieldOption[]
  /** Default when setting key is missing (select). */
  defaultValue?: string
  /** Allowed library/upload media types for type "media" (default: image). */
  mediaAccept?: Array<"image" | "video" | "document">
  /** richtext: start collapsed (~40px) when value is empty. */
  collapseEmpty?: boolean
}

export type SettingsGroup = {
  heading: string
  description?: string
  help?: string
  fields: SettingField[]
}

export type PageSection = { key: string; label: string }
