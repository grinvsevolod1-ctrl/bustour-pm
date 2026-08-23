"use client"

// Карточка секции — только локальная видимость; запись в БД по «Сохранить».
// Вынесена из page-sections-manager.tsx без изменения поведения.

import { useState } from "react"
import { Eye, EyeOff, Trash2, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export function PageSectionCardWrapper({
  sectionId,
  label,
  visible,
  onToggle,
  onDelete,
  children,
}: {
  sectionId: string
  label: string
  visible: boolean
  onToggle: () => void
  onDelete: () => void
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div
      id={`sec-${sectionId}`}
      className={cn(
        "scroll-mt-4 rounded-lg border bg-white transition-colors",
        visible ? "border-admin-border" : "border-dashed border-admin-border opacity-70",
      )}
    >
      {/* Шапка */}
      <div className={cn(
        "flex items-center justify-between gap-3 px-4 py-2.5",
        !collapsed && "border-b border-admin-border",
      )}>
        {/* Сворачивание + название */}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <ChevronDown className={cn(
            "h-4 w-4 shrink-0 text-admin-fg-muted transition-transform",
            collapsed && "-rotate-90",
          )} />
          <span className={cn(
            "text-sm font-semibold",
            visible ? "text-admin-fg" : "text-admin-fg-muted line-through",
          )}>
            {label}
          </span>
        </button>

        <div className="flex items-center gap-1.5">
          {/* Переключатель «глаз» */}
          <button
            type="button"
            onClick={onToggle}
            title={visible ? "Скрыть секцию на сайте (сохранится по кнопке «Сохранить»)" : "Показать секцию на сайте (сохранится по кнопке «Сохранить»)"}
            className={cn(
              "inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors",
              visible
                ? "text-admin-fg-muted hover:bg-amber-50 hover:text-amber-700"
                : "text-green-700 hover:bg-green-50",
            )}
          >
            {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{visible ? "Скрыть" : "Показать"}</span>
          </button>

          {/* Удаление с подтверждением */}
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              title="Удалить секцию со страницы"
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-admin-fg-muted transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Удалить</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-1">
              <span className="text-xs text-red-700">Удалить?</span>
              <button
                type="button"
                onClick={() => { setConfirmDelete(false); onDelete() }}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Да
              </button>
              <span className="text-xs text-red-300">/</span>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-red-500 hover:underline"
              >
                Нет
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Тело — редактор доступен, даже когда секция выключена на сайте */}
      {!collapsed && (
        <div className="p-4">
          {!visible && (
            <p className="mb-3 text-xs italic text-admin-fg-muted">
              Секция будет скрыта на сайте после «Сохранить». Нажмите <Eye className="inline h-3 w-3" /> чтобы включить.
            </p>
          )}
          {children}
        </div>
      )}
    </div>
  )
}
