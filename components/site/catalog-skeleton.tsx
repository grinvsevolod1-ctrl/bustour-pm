/**
 * Скелетон каталога туров: показывается мгновенно при навигации,
 * пока сервер собирает данные (туры, города, валюты, настройки CMS).
 * Общий для avtobusnye-tury / aviatory / hot. Токены bg-line/border-line —
 * те же, что в существующем loading страницы тура (единый стиль сайта).
 */
export function CatalogSkeleton() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6" aria-busy="true" aria-label="Загрузка каталога">
      {/* Хлебные крошки */}
      <div className="mb-6 h-4 w-48 animate-pulse rounded bg-line" />
      {/* Заголовок раздела */}
      <div className="mb-3 h-9 w-72 max-w-full animate-pulse rounded bg-line" />
      <div className="mb-8 h-4 w-full max-w-2xl animate-pulse rounded bg-line" />
      {/* Сетка карточек направлений */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-line">
            <div className="aspect-[4/3] w-full animate-pulse bg-line" />
            <div className="space-y-3 p-4">
              <div className="h-5 w-2/3 animate-pulse rounded bg-line" />
              <div className="h-4 w-full animate-pulse rounded bg-line" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-line" />
              <div className="flex items-center justify-between pt-2">
                <div className="h-6 w-24 animate-pulse rounded bg-line" />
                <div className="h-9 w-28 animate-pulse rounded-lg bg-line" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Загружаем каталог туров…</span>
    </main>
  )
}
