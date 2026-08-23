"use client"

// Пикер «Добавить секцию» — кнопка + панель с мокапами удалённых секций.
// В page-sections-manager.tsx этот блок был продублирован дважды
// (order-вид и content-вид); вынесен сюда, чтобы убрать дублирование.

import { Plus, X } from "lucide-react"
import type { PageSection } from "@/lib/admin-config"
import { getMockup, DefaultMockup } from "./section-mockups"

export function AddSectionPicker({
  deletedSections,
  open,
  onToggle,
  onClose,
  onAdd,
}: {
  deletedSections: PageSection[]
  open: boolean
  onToggle: () => void
  onClose: () => void
  onAdd: (fullKey: string) => void
}) {
  if (deletedSections.length === 0) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-admin-border px-4 py-3 text-sm text-admin-fg-muted transition-colors hover:border-admin-fg/40 hover:text-admin-fg"
      >
        <Plus className="h-4 w-4" />
        Добавить секцию
        <span className="ml-1 rounded-full bg-admin-muted px-1.5 py-0.5 text-xs font-medium text-admin-fg-muted">
          {deletedSections.length}
        </span>
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-admin-border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-admin-border px-4 py-3">
            <span className="text-sm font-semibold text-admin-fg">
              Удалённые секции — нажмите, чтобы вернуть
            </span>
            <button
              type="button"
              onClick={onClose}
              className="grid h-7 w-7 place-items-center rounded text-admin-fg-muted hover:bg-admin-muted hover:text-admin-fg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4">
            {deletedSections.map((sec) => (
              <button
                key={sec.key}
                type="button"
                onClick={() => onAdd(sec.key)}
                className="group flex flex-col gap-2 rounded-lg border border-admin-border p-3 text-left transition-colors hover:border-brand hover:bg-brand/5"
              >
                <div className="rounded bg-admin-muted/60 p-2 text-admin-fg-muted group-hover:text-brand">
                  {getMockup(sec.key) ?? <DefaultMockup label={sec.label} />}
                </div>
                <span className="text-xs font-medium leading-snug text-admin-fg">{sec.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
