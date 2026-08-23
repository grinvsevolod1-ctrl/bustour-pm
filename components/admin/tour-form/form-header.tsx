"use client"

// Липкая шапка формы тура: статус публикации, тумблер видимости,
// ссылка на страницу и кнопки сохранения. Вынесена из tour-form.tsx вместе
// с состоянием видимости — остальная форма им не пользуется.
import { useState, useTransition } from "react"
import { Check, ExternalLink, Eye, EyeOff, RotateCcw, Save } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { saveSettingsAction } from "@/app/admin/cms-actions"
import { Button, ButtonLink } from "@/components/admin/ui"
import { cn } from "@/lib/utils"
import type { Tour } from "@/lib/types"

export function TourFormHeader({
  tour,
  tourVisible,
  saved,
  errorText,
  pending,
  pageHref,
}: {
  tour?: Tour
  tourVisible: boolean
  saved: boolean
  errorText?: string
  pending: boolean
  pageHref?: string
}) {
  const [visible, setVisible] = useState(tourVisible)
  const [visTogglePending, startVisToggle] = useTransition()

  function toggleVisibility() {
    if (!tour) return
    const prev = visible
    const next = !visible
    setVisible(next)
    startVisToggle(async () => {
      const fd = new FormData()
      fd.set(`tour:${tour.slug}.visible`, next ? "1" : "0")
      const result = await saveSettingsAction(null, fd)
      if (result && "error" in result) {
        setVisible(prev)
        toast.error(`Не удалось изменить видимость: ${String(result.error)}`)
        return
      }
      toast.success(next ? "Тур опубликован" : "Тур скрыт")
    })
  }

  return (
    <div className={cn(
      "sticky top-0 z-40 -mx-4 mb-6 border-b bg-white/95 px-4 shadow-sm backdrop-blur-sm md:-mx-8 md:px-8 lg:-mx-10 lg:px-10",
      tour && !visible ? "border-amber-200 bg-amber-50/95" : "border-admin-border",
    )}>
      <div className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="min-w-0 flex items-center gap-2">
          <h1 className="truncate text-base font-semibold text-admin-fg">
            {tour ? `Редактирование: ${tour.title}` : "Новый тур"}
          </h1>
          {tour && (
            <span className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
              visible ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
            )}>
              {visible ? "Опубликована" : "Скрыта"}
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-green-700">
              <Check className="h-3.5 w-3.5" />
              Сохранено
            </span>
          )}
          {errorText && <span className="text-xs text-red-500">{errorText}</span>}

          {tour && (
            <button
              type="button"
              onClick={toggleVisibility}
              disabled={visTogglePending}
              title={visible ? "Скрыть страницу (404 для посетителей)" : "Опубликовать страницу"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-40",
                visible
                  ? "border-admin-border text-admin-fg-muted hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                  : "border-green-300 bg-green-50 text-green-700 hover:bg-green-100",
              )}
            >
              {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {visible ? "Скрыть" : "Опубликовать"}
            </button>
          )}

          {pageHref && (
            <Link
              href={pageHref}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-md border border-admin-border px-2.5 py-1.5 text-xs text-admin-fg-muted transition-colors hover:bg-admin-muted hover:text-admin-fg"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Открыть
            </Link>
          )}

          <ButtonLink href="/admin/tours" variant="secondary">
            <RotateCcw className="h-3.5 w-3.5" />
            Отмена
          </ButtonLink>

          <Button type="submit" form="tour-form" size="sm" disabled={pending} className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            {pending ? "Сохранение…" : "Сохранить"}
          </Button>
        </div>
      </div>
    </div>
  )
}
