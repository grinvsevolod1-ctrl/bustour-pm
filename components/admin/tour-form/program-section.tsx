"use client"

// Секция «Программа по дням» формы тура: собственное состояние блоков
// (диапазоны дней, свои заголовки) вынесено из tour-form.tsx, потому что
// больше никто из формы этим состоянием не пользуется.
import { useState } from "react"
import { ChevronDown, Plus, Trash2 } from "lucide-react"
import { RichEditor } from "@/components/admin/rich-editor-lazy"
import { FormSection, Button, Input, Label, IconButton } from "@/components/admin/ui"
import type { Tour } from "@/lib/types"

type ProgramBlock = { dayStart?: number; dayEnd?: number; customTitle?: string; text: string }

// Восстанавливаем структурные диапазоны из легаси-заголовков («День 2», «Дни 2–4»),
// чтобы старые туры оставались редактируемыми без ручного переноса.
function parseInitialProgram(program: Tour["program"] | undefined): ProgramBlock[] {
  if (program?.length) {
    return program.map((p) => {
      // Backward compat: structured ranges win; legacy display titles remain readable.
      const title = p.day.trim()
      const range = title.match(/^Дни?\s+(\d+)\s*[–—-]\s*(\d+)\s*$/i)
      const single = title.match(/^День\s+(\d+)\s*$/i)
      const legacy = range
        ? { dayStart: Number(range[1]), dayEnd: Number(range[2]), customTitle: undefined }
        : single
          ? { dayStart: Number(single[1]), dayEnd: undefined, customTitle: undefined }
          : { dayStart: undefined, dayEnd: undefined, customTitle: title }
      return { dayStart: p.dayStart ?? legacy.dayStart, dayEnd: p.dayEnd ?? legacy.dayEnd, customTitle: legacy.customTitle, text: p.text }
    })
  }
  return [{ dayStart: 1, dayEnd: undefined, customTitle: undefined, text: "" }]
}

function autoProgramTitle(b: { dayStart?: number; dayEnd?: number; customTitle?: string }) {
  if (b.customTitle && b.customTitle.trim()) return b.customTitle.trim()
  const a = b.dayStart
  const b_ = b.dayEnd
  if (a != null && b_ != null && !Number.isNaN(a) && !Number.isNaN(b_)) {
    if (a === b_) return `День ${a}`
    const [x, y] = a < b_ ? [a, b_] : [b_, a]
    return `Дни ${x}–${y}`
  }
  if (a != null && !Number.isNaN(a)) return `День ${a}`
  return "Без номера"
}

export function TourProgramSection({
  initialProgram,
  markDirty,
}: {
  initialProgram?: Tour["program"]
  markDirty: () => void
}) {
  const [program, setProgram] = useState<ProgramBlock[]>(() => parseInitialProgram(initialProgram))

  function updateProgram(index: number, patch: Partial<ProgramBlock>) {
    setProgram((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
    markDirty()
  }

  return (
    <FormSection id="s-program" title="Программа по дням">
      <div className="space-y-3">
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setProgram((p) => {
                const maxDay = p.reduce(
                  (acc, b) =>
                    Math.max(
                      acc,
                      b.dayStart ?? 0,
                      b.dayEnd ?? 0,
                    ),
                  0,
                )
                return [...p, { dayStart: Math.max(maxDay + 1, 1), dayEnd: undefined, customTitle: undefined, text: "" }]
              })
              markDirty()
            }}
          >
            <Plus className="h-4 w-4" /> День
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setProgram((p) => {
                const maxDay = p.reduce(
                  (acc, b) =>
                    Math.max(
                      acc,
                      b.dayStart ?? 0,
                      b.dayEnd ?? 0,
                    ),
                  0,
                )
                const start = Math.max(maxDay + 1, 1)
                return [
                  ...p,
                  { dayStart: start, dayEnd: start + 2, customTitle: undefined, text: "" },
                ]
              })
              markDirty()
            }}
          >
            <Plus className="h-4 w-4" /> Диапазон
          </Button>
        </div>
        <div className="rounded-lg bg-admin-muted p-3">
          {program.map((day, i) => (
            <details
              key={i}
              open={i < 2}
              className="group mb-3 overflow-hidden rounded-md border border-admin-border bg-white last:mb-0"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 hover:bg-admin-muted/40">
                <div className="flex min-w-0 items-center gap-3">
                  <ChevronDown className="h-4 w-4 shrink-0 text-admin-fg-subtle transition-transform group-open:rotate-180" />
                  <span className="inline-flex items-center rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                    {autoProgramTitle(day)}
                  </span>
                  <span className="truncate text-sm text-admin-fg-subtle">
                    {day.text
                      ? day.text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").slice(0, 100) || "— без описания —"
                      : "— без описания —"}
                  </span>
                </div>
                <IconButton
                  type="button"
                  tone="danger"
                  onClick={(e) => {
                    e.preventDefault()
                    setProgram((p) => p.filter((_, idx) => idx !== i))
                    markDirty()
                  }}
                  aria-label="Удалить блок программы"
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </summary>
              <div className="space-y-3 border-t border-admin-border px-4 py-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <Label>С (день)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={400}
                      step={1}
                      name="programDayStart"
                      value={day.dayStart ?? ""}
                      onChange={(event) => updateProgram(i, { dayStart: event.target.value === "" ? undefined : Number(event.target.value) })}
                      placeholder="2"
                    />
                  </div>
                  <div>
                    <Label>По (день, пусто — один день)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={400}
                      step={1}
                      name="programDayEnd"
                      value={day.dayEnd ?? ""}
                      onChange={(event) => updateProgram(i, { dayEnd: event.target.value === "" ? undefined : Number(event.target.value) })}
                      placeholder="4 (пусто = не диапазон)"
                    />
                  </div>
                  <div>
                    <Label>
                      Свой заголовок{" "}
                      <span className="text-admin-fg-subtle">(опционально)</span>
                    </Label>
                    <Input
                      name="programCustomTitle"
                      value={day.customTitle ?? ""}
                      onChange={(event) => updateProgram(i, { customTitle: event.target.value })}
                      placeholder="Переезд, заселение, обзорная экскурсия"
                    />
                  </div>
                </div>
                <div>
                  <Label>Описание блока (Rich-формат)</Label>
                  <RichEditor
                    name="programText"
                    defaultValue={day.text}
                    placeholder="Программа на этот блок: завтрак, автобус, свободное время…"
                  />
                </div>
              </div>
            </details>
          ))}
        </div>
        <p className="text-xs text-admin-fg-subtle">
          Подсказка: сохраните, чтобы закрепить порядок блоков. Диапазон «Дни 2–4» покажет одну карточку для нескольких одинаковых дней маршрута.
        </p>
      </div>
    </FormSection>
  )
}
