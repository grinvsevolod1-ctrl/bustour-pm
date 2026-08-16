// Чистая логика «Гида по настройке»: типы шагов и вычисление прогресса.
// Никаких обращений к БД — статусы шагов вычисляются билдерами на сервере
// (lib/setup-guide-builders.ts) из фактических данных, прогресс нигде не
// хранится, поэтому рассинхрон невозможен.

export type SetupStep = {
  /** Стабильный id шага (для key в списках). */
  id: string
  /** Короткое название шага: «Даты и цены». */
  label: string
  /** Что конкретно нужно сделать: «Добавьте хотя бы один выезд с ценой». */
  description: string
  /** Выполнен ли шаг (вычислено из данных БД). */
  done: boolean
  /**
   * Якорь вкладки/секции воркспейса (без #). EditorWorkspace активирует
   * вкладку по hash — гид просто ставит window.location.hash.
   */
  anchor?: string
  /** Переход на другую страницу админки (взаимоисключим с anchor). */
  href?: string
  /** Рекомендуемый шаг (SEO): не входит в знаменатель прогресса. */
  optional?: boolean
  /** Шаг заблокирован (сущность ещё не сохранена) — с пояснением почему. */
  locked?: boolean
}

export type SetupGuideData = {
  steps: SetupStep[]
  /** Публичный URL для PreviewModal и «Посмотреть на сайте». */
  previewUrl?: string
  /** Подпись сущности: «Тур «Париж»» или «Страница «Контакты»». */
  entityLabel: string
}

export type SetupProgress = {
  /** Выполнено обязательных шагов. */
  done: number
  /** Всего обязательных шагов. */
  total: number
  /** Следующий невыполненный шаг (сначала обязательные, потом optional). */
  next: SetupStep | null
  /** Все обязательные шаги выполнены. */
  complete: boolean
}

/**
 * Прогресс по шагам: optional-шаги не входят в знаменатель, но если все
 * обязательные готовы, следующим предлагается невыполненный optional.
 */
export function computeProgress(steps: SetupStep[]): SetupProgress {
  const required = steps.filter((step) => !step.optional)
  const done = required.filter((step) => step.done).length
  const next =
    required.find((step) => !step.done) ??
    steps.find((step) => step.optional && !step.done) ??
    null
  return { done, total: required.length, next, complete: done === required.length }
}

/**
 * Generic-билдер шагов для CMS-страниц: превращает уже вычисленные бейджи
 * групп воркспейса (badge=true → настроено) в шаги гида. Группа «SEO» —
 * рекомендуемый шаг. Ноль дополнительной логики на каждую страницу.
 */
export function buildCmsSteps(
  groups: Array<{ id: string; label: string; badge?: boolean; anchorIds?: string[] }>,
): SetupStep[] {
  return groups
    // «Порядок секций» — служебная вкладка, не влияет на готовность страницы
    .filter((group) => group.id !== "order")
    .map((group) => ({
      id: group.id,
      label: group.label,
      description: group.badge
        ? `Раздел «${group.label}» заполнен`
        : `Заполните раздел «${group.label}»`,
      done: Boolean(group.badge),
      anchor: group.anchorIds?.[0],
      optional: group.id === "seo",
    }))
}
