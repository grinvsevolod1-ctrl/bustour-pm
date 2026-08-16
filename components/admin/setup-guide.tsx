"use client"

// «Гид по настройке» — активная панель вверху редактора: чек-лист шагов с
// реальными статусами из БД, прогресс-бар, CTA «Продолжить» и превью
// публичной страницы. Разворот панели — эфемерное UI-состояние (useState).
// Рендерится обычным блоком (не в sticky-сайдбаре), порталы не нужны;
// PreviewModal сам рендерится через Dialog.Portal в body (грабля №2).

import { useCallback, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleDashed,
  Eye,
  Lock,
  Sparkles,
} from "lucide-react"
import { PreviewModal } from "@/components/admin/preview-modal"
import { computeProgress, type SetupGuideData, type SetupStep } from "@/lib/setup-guide"

/** Переход к шагу: якорь вкладки воркспейса или обычная ссылка. */
function useStepNavigation() {
  return useCallback((step: SetupStep) => {
    if (step.anchor) {
      // EditorWorkspace слушает hashchange: активирует вкладку и скроллит.
      // Если hash уже такой, события не будет — диспатчим вручную.
      const target = `#${step.anchor}`
      if (window.location.hash === target) {
        window.dispatchEvent(new HashChangeEvent("hashchange"))
      } else {
        window.location.hash = target
      }
    }
  }, [])
}

function StepIcon({ step }: { step: SetupStep }) {
  if (step.locked) return <Lock className="h-3.5 w-3.5 text-admin-fg-muted" aria-hidden />
  if (step.done)
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <Check className="h-3 w-3" aria-hidden />
      </span>
    )
  return <CircleDashed className="h-5 w-5 text-admin-fg-muted" aria-hidden />
}

function StepRow({ step, onNavigate }: { step: SetupStep; onNavigate: (step: SetupStep) => void }) {
  const inner = (
    <>
      <StepIcon step={step} />
      <span className="min-w-0 flex-1">
        <span
          className={`block text-sm ${step.done ? "text-admin-fg-muted line-through decoration-admin-border" : "font-medium text-admin-fg"}`}
        >
          {step.label}
          {step.optional ? (
            <span className="ml-1.5 rounded bg-admin-muted px-1.5 py-0.5 text-[10px] font-normal uppercase tracking-wide text-admin-fg-muted no-underline">
              рекомендуется
            </span>
          ) : null}
        </span>
        <span className="block truncate text-xs text-admin-fg-muted">{step.description}</span>
      </span>
      {!step.done && !step.locked ? (
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-admin-fg-muted" aria-hidden />
      ) : null}
    </>
  )

  const rowClass =
    "flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors"

  if (step.locked) {
    return (
      <li>
        <div className={`${rowClass} opacity-60`}>{inner}</div>
      </li>
    )
  }
  if (step.href) {
    return (
      <li>
        <Link href={step.href} className={`${rowClass} hover:bg-admin-muted`}>
          {inner}
        </Link>
      </li>
    )
  }
  return (
    <li>
      <button type="button" onClick={() => onNavigate(step)} className={`${rowClass} hover:bg-admin-muted`}>
        {inner}
      </button>
    </li>
  )
}

export function SetupGuide({ data }: { data: SetupGuideData }) {
  const { steps, previewUrl, entityLabel } = data
  const progress = computeProgress(steps)
  const [expanded, setExpanded] = useState(!progress.complete)
  const [previewOpen, setPreviewOpen] = useState(false)
  const navigate = useStepNavigation()

  if (steps.length === 0) return null

  const percent = progress.total === 0 ? 100 : Math.round((progress.done / progress.total) * 100)
  const next = progress.next

  return (
    <section
      aria-label={`Гид по настройке: ${entityLabel}`}
      className={`mb-4 rounded-lg border ${
        progress.complete ? "border-emerald-200 bg-emerald-50/60" : "border-admin-border bg-admin-card"
      }`}
    >
      {/* Шапка: прогресс + CTA */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {progress.complete ? (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
          ) : (
            <span
              className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-admin-muted text-[10px] font-semibold text-admin-fg"
              role="img"
              aria-label={`Готово ${percent}%`}
            >
              {percent}%
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-admin-fg">
              {progress.complete ? "Всё настроено" : `Настройка: ${entityLabel}`}
            </p>
            <p className="truncate text-xs text-admin-fg-muted">
              {progress.complete
                ? next
                  ? `Рекомендуем также: ${next.label}`
                  : "Все шаги выполнены — страница готова"
                : `Готово ${progress.done} из ${progress.total}${next ? ` · далее: ${next.label}` : ""}`}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {next && !next.locked ? (
            next.href ? (
              <Link
                href={next.href}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-admin-fg bg-admin-fg px-3 text-xs font-medium text-white hover:bg-admin-fg/90"
              >
                Продолжить: {next.label}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => navigate(next)}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-admin-fg bg-admin-fg px-3 text-xs font-medium text-white hover:bg-admin-fg/90"
              >
                Продолжить: {next.label}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            )
          ) : null}
          {previewUrl ? (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-admin-border px-3 text-xs text-admin-fg hover:bg-admin-muted"
            >
              <Eye className="h-3.5 w-3.5" aria-hidden />
              Превью
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-admin-border text-admin-fg-muted hover:bg-admin-muted"
            aria-label={expanded ? "Свернуть шаги" : "Показать шаги"}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
        </div>
      </div>

      {/* Прогресс-бар */}
      {!progress.complete ? (
        <div className="px-4 pb-1">
          <div
            className="h-1 w-full overflow-hidden rounded-full bg-admin-muted"
            role="progressbar"
            aria-valuenow={progress.done}
            aria-valuemin={0}
            aria-valuemax={progress.total}
          >
            <div
              className="h-full rounded-full bg-admin-fg transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Полный чек-лист */}
      {expanded ? (
        <ul className="space-y-0.5 border-t border-admin-border/60 px-2 py-2">
          {steps.map((step) => (
            <StepRow key={step.id} step={step} onNavigate={navigate} />
          ))}
        </ul>
      ) : null}

      {previewUrl ? (
        <PreviewModal
          url={previewUrl}
          title={`Предпросмотр: ${entityLabel}`}
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}
    </section>
  )
}
