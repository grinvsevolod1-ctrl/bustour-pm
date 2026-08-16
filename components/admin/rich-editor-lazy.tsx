"use client"

// Ленивая обёртка над TipTap-редактором — самой тяжёлой клиентской
// зависимостью админки. Выносит @tiptap/* в отдельный чанк: формы
// админки загружаются и становятся интерактивными до загрузки редактора.
// Импортируй RichEditor отсюда, НЕ из "./rich-editor" напрямую.
import dynamic from "next/dynamic"

export const RichEditor = dynamic(
  () => import("@/components/admin/rich-editor").then((m) => m.RichEditor),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex min-h-[120px] items-center justify-center rounded-md border border-border bg-muted/30 text-sm text-muted-foreground"
        aria-busy="true"
      >
        Загрузка редактора…
      </div>
    ),
  },
)
