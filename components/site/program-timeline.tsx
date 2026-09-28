"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { sanitizeCmsHtml } from "@/lib/sanitize-html"

/**
 * Extracts a short numeric day label (and a noun word) from a stored `day` string.
 *  - "День 3"            → { num: "3",  word: "день"  }
 *  - "Дни 2–4" / "Дни 2-4" → { num: "2–4", word: "дни" }
 *  - anything else (legacy free-form or custom) → fall back to first 1-3 tokens / trimmed.
 */
function parseDayLabel(raw: string): { num: string; word: string; fullTitle: string } {
  const s = raw.trim()
  if (!s) return { num: "1", word: "день", fullTitle: "День 1" }
  const mRange = s.match(/^Дни?\s+(\d+)\s*[–—-]\s*(\d+)\s*$/i)
  if (mRange) {
    const [, a, b] = mRange
    return { num: `${a}–${b}`, word: "дней", fullTitle: s }
  }
  const mSingle = s.match(/^День\s+(\d+)\s*$/i)
  if (mSingle) {
    const [, n] = mSingle
    const x = Number(n)
    const word = x % 10 === 1 && x % 100 !== 11 ? "день" : x % 10 >= 2 && x % 10 <= 4 && (x % 100 < 10 || x % 100 >= 20) ? "дня" : "дней"
    return { num: n, word, fullTitle: s }
  }
  return { num: "", word: "", fullTitle: s }
}

/** Склонение слова «день» по числу: 1 день, 2–4 дня, 5–20 дней. */
function pluralDay(x: number): string {
  return x % 10 === 1 && x % 100 !== 11
    ? "день"
    : x % 10 >= 2 && x % 10 <= 4 && (x % 100 < 10 || x % 100 >= 20)
      ? "дня"
      : "дней"
}

/**
 * Число в левой колонке. Структурные dayStart/dayEnd — источник истины: они
 * работают даже когда у блока задан свой заголовок (тогда парсинг `day` даёт
 * пусто и раньше терялся диапазон). Иначе — откат к разбору строки `day`.
 */
function dayColumnLabel(
  dayStart: number | undefined,
  dayEnd: number | undefined,
  parsed: { num: string; word: string },
): { num: string; word: string } {
  if (dayStart != null && Number.isFinite(dayStart)) {
    if (dayEnd != null && Number.isFinite(dayEnd) && dayEnd !== dayStart) {
      const [a, b] = dayStart < dayEnd ? [dayStart, dayEnd] : [dayEnd, dayStart]
      return { num: `${a}–${b}`, word: "дней" }
    }
    return { num: String(dayStart), word: pluralDay(dayStart) }
  }
  return { num: parsed.num, word: parsed.word }
}

/** Rich or plain? Legacy tour text was plain; new program saves HTML. Render via dangerouslySetInnerHTML if tags present. */
function renderProgramText(text: string) {
  const t = text ?? ""
  const hasHtml = /<[a-zA-Z][^>]*>/.test(t)
  if (hasHtml) {
    return (
      <div
        className="prose-content text-ink"
        // Программа тура набирается в админке, но рендер обязан проходить санитайз:
        // угнанная сессия редактора не должна давать stored XSS у посетителей.
        dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(t) }}
      />
    )
  }
  return <div className="whitespace-pre-wrap text-base leading-relaxed text-ink">{t}</div>
}

export function ProgramTimeline({
  items,
}: {
  items: { day: string; text: string; dayStart?: number; dayEnd?: number }[]
}) {
  const [open, setOpen] = useState<number | null>(0)
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])
  // Позиция нажатой строки до переключения: при раскрытии дня схлопывается
  // ранее открытый день ВЫШЕ — контент над строкой укорачивается и страница
  // «прыгает» (видео владельца, мобайл). После рендера компенсируем разницу.
  const anchor = useRef<{ idx: number; top: number } | null>(null)

  useLayoutEffect(() => {
    const a = anchor.current
    if (!a) return
    anchor.current = null
    const el = rowRefs.current[a.idx]
    if (!el) return
    const delta = el.getBoundingClientRect().top - a.top
    if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: "instant" as ScrollBehavior })
  }, [open])

  const toggle = (i: number) => {
    const el = rowRefs.current[i]
    if (el) anchor.current = { idx: i, top: el.getBoundingClientRect().top }
    setOpen((cur) => (cur === i ? null : i))
  }

  if (!items.length) return null
  const lastIdx = items.length - 1

  return (
    // overflow-x-clip — страховка: раскрытая жёлтая плашка с -ml-16 и любой
    // широкий контент внутри дня (длинные слова, таблицы) не должны пробивать
    // карточку и раздувать страницу в горизонтальный скролл — иначе на телефоне
    // «уезжает» вся портянка и визуально смещается H1 (#mobile-program).
    <div className="overflow-x-clip rounded-3xl bg-white">
      {items.map((p, i) => {
        const isOpen = open === i
        const isLast = i === lastIdx
        const parsed = parseDayLabel(p.day)
        const col = dayColumnLabel(p.dayStart, p.dayEnd, parsed)
        const label = { num: col.num, word: col.word, fullTitle: parsed.fullTitle }
        // Диапазон («3–13», «13–15») шире одиночной цифры — уменьшаем кегль,
        // иначе крупный номер вылезает из узкой колонки и наезжает на заголовок.
        const isRange = /[–—-]/.test(label.num)
        return (
          <div
            key={`${p.day}::${p.text.slice(0, 48)}`}
            ref={(el) => {
              rowRefs.current[i] = el
            }}
            role="button"
            tabIndex={0}
            aria-expanded={isOpen}
            // Grid вместо flex + -ml-16: раньше плашка текста на телефоне тянулась
            // под колонку номера и наезжала на подпись «1–5 дней», если заголовок
            // был в одну строку. Теперь текст дня — отдельная строка сетки.
            className="grid cursor-pointer grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-x-3 rounded-xl px-2 py-3 transition-colors [overflow-anchor:none] hover:bg-[#fafafa] focus-visible:outline-2 focus-visible:outline-brand md:grid-cols-[4rem_minmax(0,1fr)] md:gap-x-6 md:px-6"
            onClick={() => toggle(i)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                toggle(i)
              }
            }}
          >
            {/* Left: day number + дней label + dashed connector */}
            <div className="flex flex-col items-center self-stretch md:row-span-2">
              <span
                className={`whitespace-nowrap font-semibold leading-tight tabular-nums transition-colors ${
                  isRange ? "text-lg md:text-xl" : "text-2xl"
                } ${isOpen ? "text-brand" : "text-ink-muted"}`}
              >
                {label.num || (i + 1)}
              </span>
              <span
                className={`text-base font-normal leading-tight transition-colors ${
                  isOpen ? "text-brand" : "text-ink-muted"
                }`}
              >
                {label.word || "день"}
              </span>
              {/* Dashed amber line — visible only when expanded and not the last item */}
              {/* Пунктирный соединитель между днями: на телефоне (320–768px)
                  он съедает ширину узкой программы — прячем его до md (#5). */}
              {isOpen && !isLast && (
                <div
                  className="mt-2 hidden w-0.5 flex-1 md:block"
                  style={{
                    marginBottom: "-12px",
                    backgroundImage:
                      "linear-gradient(to bottom, var(--color-brand, #F0B336) 50%, transparent 50%)",
                    backgroundSize: "2px 14px",
                    backgroundRepeat: "repeat-y",
                  }}
                  aria-hidden
                />
              )}
            </div>

            {/* Right: header + body */}
            {/* min-w-0 обязателен: без него flex-элемент не сжимается ниже
                интринсик-ширины контента (длинные слова/таблицы в программе дня)
                и раздувает строку шире карточки → горизонтальный скролл (#mobile-program). */}
            <div className="flex min-h-14 min-w-0 items-center justify-between gap-3 self-center">
              <h3 className="min-w-0 text-pretty break-words text-base font-semibold leading-snug text-ink md:text-lg">
                {label.fullTitle}
              </h3>
              {isOpen ? (
                <ChevronDown className="h-5 w-5 shrink-0 text-brand" aria-hidden />
              ) : (
                <ChevronRight className="h-5 w-5 shrink-0 text-brand" aria-hidden />
              )}
            </div>
            {isOpen && p.text ? (
              // На телефоне текст дня занимает всю ширину карточки под номером и
              // заголовком (col-span-2); на md — только правую колонку.
              <div className="col-span-2 mt-3 min-w-0 rounded-lg bg-[#FFF9ED] px-3 py-4 text-base leading-relaxed text-ink md:col-span-1 md:col-start-2 md:px-4">
                {renderProgramText(p.text)}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
