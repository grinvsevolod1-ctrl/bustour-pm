"use client"

import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { Sparkles, Undo2 } from "lucide-react"
import type { SettingField } from "@/lib/admin-config"
import {
  SEO_DESCRIPTION_MAX,
  SEO_TITLE_MAX,
  buildAutoDescription,
  buildAutoTitle,
  metaLengthZone,
  stripHtmlToText,
} from "@/lib/seo-auto"
import { FieldsGrid } from "@/components/admin/section-fields-form"
import { PageSettingsFormContext } from "@/components/admin/page-settings-form"
import { FormSection } from "@/components/admin/ui"
import { cn } from "@/lib/utils"

/** Цвета зон длины для счётчиков. */
const zoneTextClass = {
  ok: "text-emerald-600",
  warn: "text-amber-600",
  over: "text-red-600",
} as const

/**
 * SERP-превью: как страница выглядит в выдаче Google. Управляемый компонент —
 * переиспользуется и вкладкой SEO CMS-страниц, и формами тура/статьи.
 */
export function SerpPreview({
  host,
  path,
  title,
  description,
  titleIsAuto,
  descriptionIsAuto,
}: {
  host: string
  path: string
  title: string
  description: string
  titleIsAuto: boolean
  descriptionIsAuto: boolean
}) {
  const crumbs = path
    .split("/")
    .filter(Boolean)
    .join(" › ")
  return (
    <div className="rounded-lg border border-admin-border bg-white p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-admin-fg-muted">
        Предпросмотр в поиске
      </p>
      <div className="max-w-xl">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#dadce0] bg-[#f1f3f4] text-[11px] font-bold text-[#5f6368]"
          >
            Б
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm text-[#202124]">{host}</p>
            <p className="truncate text-xs text-[#5f6368]">
              {host}
              {crumbs ? ` › ${crumbs}` : ""}
            </p>
          </div>
        </div>
        <p className="mt-1.5 truncate text-xl leading-snug text-[#1a0dab]">
          {title || "Без заголовка"}
        </p>
        <p className="mt-1 line-clamp-2 text-sm leading-snug text-[#4d5156]">
          {description || "Описание не задано — поисковик подставит текст со страницы."}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <ModeChip label="Title" isAuto={titleIsAuto} />
          <ModeChip label="Description" isAuto={descriptionIsAuto} />
        </div>
      </div>
    </div>
  )
}

function ModeChip({ label, isAuto }: { label: string; isAuto: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        isAuto
          ? "border-sky-200 bg-sky-50 text-sky-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      {label}: {isAuto ? "Авто" : "Вручную"}
    </span>
  )
}

/** Счётчик длины: «Title · 43/60». */
export function MetaLengthCounter({
  label,
  length,
  max,
  isAuto,
}: {
  label: string
  length: number
  max: number
  isAuto: boolean
}) {
  const zone = metaLengthZone(length, max)
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-admin-fg-muted">
      {label}
      <span className={cn("font-medium tabular-nums", zoneTextClass[zone])}>
        {length}/{max}
      </span>
      {isAuto && <span className="text-sky-600">(авто)</span>}
    </span>
  )
}

/** Живое значение контрола по name (hidden input TipTap-обёрток, textarea, input). */
function readControlValue(key: string): string | null {
  const controls = document.getElementsByName(key)
  for (const control of controls) {
    if (
      control instanceof HTMLInputElement ||
      control instanceof HTMLTextAreaElement
    ) {
      return control.value
    }
  }
  return null
}

export type SeoPanelProps = {
  /** Поля группы «SEO и мета» из конфига страницы (рендерятся FieldsGrid). */
  fields: SettingField[]
  settings: Record<string, string>
  /** Хост публичного сайта для SERP-превью (bus-tour.by). */
  serpHost: string
  /** Путь страницы (/hot/). */
  serpPath: string
  /** Ключ настройки-источника заголовка (hot.h1). */
  sourceTitleKey?: string
  /** Ключ настройки-источника описания (hot.intro). */
  sourceDescriptionKey?: string
  /** Статический fallback заголовка, когда источник пуст (заголовок страницы). */
  fallbackTitle?: string
}

/**
 * Вкладка «SEO» редактора страницы: SERP-превью из эффективных значений
 * (ручное поле → авто из контента → fallback), режимы Авто/Вручную, счётчики
 * длины и автозаполнение. Поля сохраняются общим Save страницы (form=formId
 * через контекст PageSettingsForm) — экшены и БД не меняются: авто-режим —
 * это просто пустое поле, fallback применяет buildMetadata на публичной стороне.
 */
export function SeoPanel({
  fields,
  settings,
  serpHost,
  serpPath,
  sourceTitleKey,
  sourceDescriptionKey,
  fallbackTitle,
}: SeoPanelProps) {
  const pageForm = useContext(PageSettingsFormContext)

  const metaTitleKey = fields.find((f) => f.key.endsWith("metaTitle"))?.key
  const metaDescriptionKey = fields.find((f) => f.key.endsWith("metaDescription"))?.key
  const metaShortDescKey = fields.find((f) => f.key.endsWith("metaShortDesc"))?.key

  /** Автозаполнение: override поверх settings → ShortcodeInput синхронизирует
   *  редактор при смене defaultValue (см. его useEffect). */
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const effectiveSettings = useMemo(
    () => ({ ...settings, ...overrides }),
    [settings, overrides],
  )

  /** Живые значения (обновляются по input-событиям + семплингом: TipTap-поля
   *  не диспатчат нативные события — их hidden input обновляет React). */
  const [live, setLive] = useState<Record<string, string>>({})

  const watchedKeys = useMemo(
    () =>
      [metaTitleKey, metaDescriptionKey, metaShortDescKey, sourceTitleKey, sourceDescriptionKey].filter(
        (k): k is string => Boolean(k),
      ),
    [metaTitleKey, metaDescriptionKey, metaShortDescKey, sourceTitleKey, sourceDescriptionKey],
  )

  const sample = useCallback(() => {
    setLive((prev) => {
      let changed = false
      const next: Record<string, string> = { ...prev }
      for (const key of watchedKeys) {
        const value = readControlValue(key)
        if (value !== null && value !== prev[key]) {
          next[key] = value
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [watchedKeys])

  useEffect(() => {
    sample()
    // Мгновенная реакция на обычные поля + семплинг для TipTap-обёрток.
    document.addEventListener("input", sample, true)
    const interval = window.setInterval(sample, 1200)
    return () => {
      document.removeEventListener("input", sample, true)
      window.clearInterval(interval)
    }
  }, [sample])

  const valueOf = useCallback(
    (key?: string): string => {
      if (!key) return ""
      return (live[key] ?? overrides[key] ?? settings[key] ?? "").trim()
    },
    [live, overrides, settings],
  )

  const manualTitle = valueOf(metaTitleKey)
  const manualDescription = valueOf(metaShortDescKey) || valueOf(metaDescriptionKey)
  const sourceTitle = valueOf(sourceTitleKey)
  const sourceDescription = valueOf(sourceDescriptionKey)

  const autoTitle = buildAutoTitle(sourceTitle) || (fallbackTitle ?? "")
  const autoDescription = buildAutoDescription(sourceDescription)

  const titleIsAuto = !manualTitle
  const descriptionIsAuto = !manualDescription
  const effectiveTitle = manualTitle || autoTitle
  const effectiveDescription = manualDescription || autoDescription

  const canAutofill = Boolean(autoTitle || autoDescription)

  function autofillFromContent() {
    const next: Record<string, string> = {}
    if (metaTitleKey && autoTitle) next[metaTitleKey] = autoTitle
    const descTarget = metaShortDescKey ?? metaDescriptionKey
    if (descTarget && autoDescription) next[descTarget] = autoDescription
    if (Object.keys(next).length === 0) return
    setOverrides((prev) => ({ ...prev, ...next }))
    setLive((prev) => ({ ...prev, ...next }))
  }

  function resetToAuto() {
    const next: Record<string, string> = {}
    for (const key of [metaTitleKey, metaDescriptionKey, metaShortDescKey]) {
      if (key) next[key] = ""
    }
    setOverrides((prev) => ({ ...prev, ...next }))
    setLive((prev) => ({ ...prev, ...next }))
  }

  return (
    <div className="space-y-4">
      <SerpPreview
        host={serpHost}
        path={serpPath}
        title={stripHtmlToText(effectiveTitle)}
        description={stripHtmlToText(effectiveDescription)}
        titleIsAuto={titleIsAuto}
        descriptionIsAuto={descriptionIsAuto}
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-admin-border bg-admin-muted/40 px-4 py-3">
        <MetaLengthCounter
          label="Title"
          length={stripHtmlToText(effectiveTitle).length}
          max={SEO_TITLE_MAX}
          isAuto={titleIsAuto}
        />
        <MetaLengthCounter
          label="Description"
          length={stripHtmlToText(effectiveDescription).length}
          max={SEO_DESCRIPTION_MAX}
          isAuto={descriptionIsAuto}
        />
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            onClick={autofillFromContent}
            disabled={!canAutofill}
            title={
              canAutofill
                ? "Скопировать авто-значения в поля для ручной доводки"
                : "Заполните заголовок и вводный абзац страницы — авто-значения появятся сами"
            }
            className="inline-flex items-center gap-1.5 rounded-md border border-admin-border bg-white px-2.5 py-1.5 text-xs font-medium text-admin-fg transition-colors hover:bg-admin-muted disabled:opacity-40"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Заполнить из контента
          </button>
          <button
            type="button"
            onClick={resetToAuto}
            title="Очистить ручные значения — сайт вернётся к автоматическим"
            className="inline-flex items-center gap-1.5 rounded-md border border-admin-border bg-white px-2.5 py-1.5 text-xs font-medium text-admin-fg-muted transition-colors hover:bg-admin-muted"
          >
            <Undo2 className="h-3.5 w-3.5" />
            Сбросить на авто
          </button>
        </div>
      </div>

      <FormSection id="s-seo-fields" title="Поля SEO" collapsible={false}>
        <p className="mb-3 text-xs text-admin-fg-muted">
          Пустое поле = автоматический режим: сайт подставит значение из контента страницы.
          Шорткоды (например {"{телефон}"}) разворачиваются при публикации.
        </p>
        <FieldsGrid fields={fields} settings={effectiveSettings} form={pageForm?.formId} />
      </FormSection>
    </div>
  )
}
