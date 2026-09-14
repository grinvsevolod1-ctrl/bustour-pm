/**
 * Универсальный скелетон контентных страниц (компания, контакты, отзывы,
 * полезное, аренда). Показывается мгновенно при навигации, пока сервер
 * собирает данные. Токены bg-line/border-line/bg-cream — единый стиль сайта,
 * как в CatalogSkeleton и loading страницы тура.
 */
export function ContentSkeleton({ cards = true }: { cards?: boolean }) {
  return (
    <main
      className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6"
      aria-busy="true"
      aria-label="Загрузка страницы"
    >
      {/* Хлебные крошки */}
      <div className="mb-6 h-4 w-48 animate-pulse rounded bg-line" />
      {/* Заголовок */}
      <div className="mb-3 h-9 w-80 max-w-full animate-pulse rounded bg-line" />
      {/* Подзаголовок / вводный текст */}
      <div className="mb-2 h-4 w-full max-w-2xl animate-pulse rounded bg-line" />
      <div className="mb-8 h-4 w-2/3 max-w-xl animate-pulse rounded bg-line" />

      {cards ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-line">
              <div className="aspect-[4/3] w-full animate-pulse bg-line" />
              <div className="space-y-3 p-4">
                <div className="h-5 w-2/3 animate-pulse rounded bg-line" />
                <div className="h-4 w-full animate-pulse rounded bg-line" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-line" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-4 animate-pulse rounded bg-line"
              style={{ width: `${90 - (i % 4) * 12}%` }}
            />
          ))}
        </div>
      )}
      <span className="sr-only">Загружаем страницу…</span>
    </main>
  )
}
