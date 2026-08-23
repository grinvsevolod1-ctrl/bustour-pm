"use client"

// Боковая якорная навигация по секциям — тот же визуальный стиль, что и
// FormAnchorNav в ui.tsx, но с кнопками перестановки Вверх/Вниз и точкой статуса.
// Вынесена из page-sections-manager.tsx без изменения поведения.

import { ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PageSection } from "@/lib/admin-config"
import { sectionSettingKey, toShortSectionKey } from "./draft-store"

export function SectionsNav({
  pageKey,
  settingsPrefix = pageKey,
  sections,
  order,
  visibleMap,
  onMoveUp,
  onMoveDown,
}: {
  pageKey: string
  settingsPrefix?: string
  sections: PageSection[]
  order: string[]
  visibleMap: Record<string, boolean>
  onMoveUp: (key: string) => void
  onMoveDown: (key: string) => void
}) {
  // Держим короткие ключи в навигации, чтобы onMoveUp/onMoveDown получали корректный короткий ключ
  const ordered = order
    .map((k) => {
      // Точное совпадение, затем базовый ключ (seo2 → seo)
      const fullKey = sectionSettingKey(settingsPrefix, k)
      const sec = sections.find((s) => s.key === fullKey)
        ?? sections.find((s) => s.key === sectionSettingKey(settingsPrefix, k.replace(/\d+$/, "")))
      if (!sec) return null
      // Сохраняем короткий ключ, чтобы вызывающий код получал его напрямую, без split
      return { ...sec, key: k }
    })
    .filter(Boolean) as PageSection[]

  return (
    <nav
      className="sticky top-4 hidden w-48 shrink-0 xl:block"
      aria-label="Разделы страницы"
    >
      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-admin-fg-muted">
        Разделы
      </p>
      <ul className="space-y-0.5">
        {ordered.map((sec, idx) => {
          const shortKey = toShortSectionKey(sec.key)
          const isVisible = visibleMap[sec.key] !== false
          return (
            <li key={sec.key} className="group flex items-center gap-1">
              {/* Вверх / Вниз */}
              <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => onMoveUp(sec.key)}
                  disabled={idx === 0}
                  title="Переместить вверх"
                  className="grid h-4 w-4 place-items-center rounded text-admin-fg-muted hover:text-admin-fg disabled:opacity-20"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onMoveDown(sec.key)}
                  disabled={idx === ordered.length - 1}
                  title="Переместить вниз"
                  className="grid h-4 w-4 place-items-center rounded text-admin-fg-muted hover:text-admin-fg disabled:opacity-20"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>

              {/* Якорная ссылка */}
              <a
                href={`#sec-${shortKey}`}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-admin-muted hover:text-admin-fg",
                  isVisible ? "text-admin-fg-muted" : "text-admin-fg-muted/50 line-through",
                )}
              >
                {/* Точка видимости */}
                <span
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    isVisible ? "bg-green-500" : "bg-admin-border",
                  )}
                  aria-hidden
                />
                <span className="truncate">{sec.label}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
