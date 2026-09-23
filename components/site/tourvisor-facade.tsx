"use client"

import { CalendarDays, Flame, MapPin, Plane, Search, Users } from "lucide-react"

type Variant = "search" | "hot"

interface Props {
  variant: Variant
  /** Виджет уже запрошен и грузится — показываем состояние ожидания. */
  loading: boolean
  /** Пользователь кликнул по фасаду — надо немедленно грузить настоящий виджет. */
  onActivate: () => void
}

const SEARCH_FIELDS = [
  { icon: MapPin, label: "Куда", value: "Страна или курорт" },
  { icon: Plane, label: "Откуда", value: "Минск" },
  { icon: CalendarDays, label: "Даты вылета", value: "Выберите даты" },
  { icon: Users, label: "Туристы", value: "2 взрослых" },
] as const

const HOT_PLACEHOLDERS = ["Турция", "Египет", "ОАЭ"] as const

/**
 * Статичный «фасад» виджета Tourvisor (паттерн facade для сторонних
 * встраиваний). Рендерится сервером, не тянет ни байта стороннего JS и
 * занимает ту же высоту, что и настоящий виджет, — поэтому Lighthouse видит
 * готовую форму без TBT, а появление реального виджета не двигает layout.
 *
 * Весь фасад — одна кнопка: любой клик/тап по нему (или Enter с клавиатуры)
 * запускает загрузку init.js. Вложенных интерактивных элементов нет намеренно.
 */
export function TourvisorFacade({ variant, loading, onActivate }: Props) {
  const isHot = variant === "hot"
  const cta = isHot ? "Показать горящие туры" : "Найти тур"
  const hint = isHot
    ? "Нажмите, чтобы загрузить актуальные предложения"
    : "Нажмите, чтобы открыть поиск по всем туроператорам"

  return (
    <button
      type="button"
      onClick={onActivate}
      disabled={loading}
      aria-busy={loading}
      aria-label={loading ? "Загружаем поиск туров" : `${cta}. Открыть поиск туров`}
      className="group flex min-h-[220px] w-full cursor-pointer flex-col justify-center gap-4 rounded-2xl border border-line bg-white p-4 text-left transition-colors hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-progress sm:p-5"
    >
      <span className="flex flex-col gap-3 md:flex-row md:items-stretch">
        {isHot
          ? HOT_PLACEHOLDERS.map((title) => (
              <span
                key={title}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-line bg-cream/60 px-3 py-3"
              >
                <Flame className="size-5 shrink-0 text-price" aria-hidden="true" />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold text-ink">{title}</span>
                  <span className="text-xs text-ink-muted">Цены и даты — у туроператоров</span>
                </span>
              </span>
            ))
          : SEARCH_FIELDS.map(({ icon: Icon, label, value }) => (
              <span
                key={label}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-line bg-cream/60 px-3 py-3"
              >
                <Icon className="size-5 shrink-0 text-cyan-accent" aria-hidden="true" />
                <span className="flex min-w-0 flex-col">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</span>
                  <span className="truncate text-sm text-ink">{value}</span>
                </span>
              </span>
            ))}

        <span className="flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-brand-foreground transition-colors group-hover:bg-brand-dark md:min-w-44">
          {loading ? (
            <span
              className="size-4 animate-spin rounded-full border-2 border-brand-foreground/30 border-t-brand-foreground"
              aria-hidden="true"
            />
          ) : isHot ? (
            <Flame className="size-4" aria-hidden="true" />
          ) : (
            <Search className="size-4" aria-hidden="true" />
          )}
          {loading ? "Загружаем…" : cta}
        </span>
      </span>

      <span className="text-center text-xs text-ink-muted">{hint}</span>
    </button>
  )
}
