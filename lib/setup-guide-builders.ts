// Вычислители шагов «Гида по настройке» по доменам. Работают на сервере с
// уже загруженными данными страницы (без дополнительных запросов), поэтому
// статусы всегда синхронны тому, что реально видит редактор.

import type { Tour } from "@/lib/types"
import type { SetupGuideData, SetupStep } from "@/lib/setup-guide"
import { buildCmsSteps } from "@/lib/setup-guide"

/**
 * Гид для тура — самый важный флоу админки:
 * Основное → Программа → Даты и цены → Публикация (+ SEO рекомендуемым).
 * Для несохранённого тура (/tours/new) все шаги после первого заблокированы —
 * вместо прежнего пассивного «Сохраните тур, затем добавьте цены».
 */
export function buildTourGuide({
  tour,
  tourVisible,
  tourMeta,
}: {
  tour?: Tour
  tourVisible: boolean
  tourMeta: Record<string, string>
}): SetupGuideData {
  const isNew = !tour
  const steps: SetupStep[] = [
    {
      id: "main",
      label: "Основное",
      description: isNew
        ? "Заполните название, описание, страну и город — затем сохраните тур"
        : "Название, описание, обложка и направление",
      done: Boolean(tour && tour.title && tour.description && tour.image && tour.countryId),
      anchor: "s-main",
    },
    {
      id: "program",
      label: "Программа",
      description: isNew
        ? "Станет доступно после сохранения тура"
        : "Добавьте программу по дням — главный контент страницы",
      done: Boolean(tour && tour.program.length > 0),
      anchor: "s-program",
      locked: isNew,
    },
    {
      id: "dates",
      label: "Даты и цены",
      description: isNew
        ? "Станет доступно после сохранения тура"
        : "Добавьте хотя бы один выезд с ценой — без него тур не показывает цен",
      done: Boolean(tour && tour.datesTable.rows.length > 0),
      anchor: "s-dates",
      locked: isNew,
    },
    {
      id: "seo",
      label: "SEO",
      description: isNew
        ? "Станет доступно после сохранения тура"
        : "Title и описание для поиска (иначе возьмётся авто-вариант)",
      done: Boolean(tourMeta.metaTitle?.trim() || tourMeta.metaDescription?.trim()),
      anchor: "s-seo-meta",
      optional: true,
      locked: isNew,
    },
    {
      id: "publish",
      label: "Публикация",
      description: isNew
        ? "Станет доступно после сохранения тура"
        : tourVisible
          ? "Тур виден на сайте"
          : "Тур скрыт — включите видимость, когда всё готово",
      done: Boolean(tour) && tourVisible,
      anchor: "s-main",
      locked: isNew,
    },
  ]
  return {
    steps,
    previewUrl: tour ? `/tour/${tour.slug}/` : undefined,
    entityLabel: tour ? `тур «${tour.title}»` : "новый тур",
  }
}

/**
 * Generic-гид из уже вычисленных групп воркспейса (бейдж = раздел заполнен).
 * Используется всеми CMS-страницами и редакторами сущностей, где вкладки
 * воркспейса и есть шаги настройки. Ноль дополнительной логики на страницу.
 */
export function buildWorkspaceGuide({
  groups,
  previewUrl,
  entityLabel,
}: {
  groups: Array<{ id: string; label: string; badge?: boolean; anchorIds?: string[] }>
  previewUrl?: string
  entityLabel: string
}): SetupGuideData {
  return { steps: buildCmsSteps(groups), previewUrl, entityLabel }
}
