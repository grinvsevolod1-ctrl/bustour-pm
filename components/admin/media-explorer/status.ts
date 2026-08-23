import type { MediaSort } from "@/lib/media"
import type { MediaItem, MediaType, UploadedFile } from "@/components/admin/media-uploader"

/**
 * Статусы обработки медиа и опции фильтров, выделенные из media-explorer.tsx.
 * Чистые функции без состояния — подписи статусов должны совпадать со стадиями
 * обработки в lib/media/service.ts (queued/processing/converting/finalizing).
 */

export type FilterType = "all" | MediaType

export const filterOptions: { value: FilterType; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "image", label: "Изображения" },
  { value: "video", label: "Видео" },
  { value: "document", label: "Документы" },
]

export const sortOptions: { value: MediaSort; label: string }[] = [
  { value: "createdAt:desc", label: "Сначала новые" },
  { value: "createdAt:asc", label: "Сначала старые" },
]

export function readyMediaItem(file: UploadedFile): MediaItem {
  return {
    ...file,
    status: "ready",
    processingStage: "ready",
    errorMessage: null,
    mimeType: "",
  }
}

export function mediaStatusLabel(file: MediaItem): string {
  if (file.status === "ready") return "Готов"
  if (file.status === "failed") return "Ошибка обработки"

  switch (file.processingStage) {
    case "queued":
      return "В очереди"
    case "processing":
      return "Обрабатывается"
    case "converting":
      return "Конвертация"
    case "finalizing":
      return "Завершение"
    default:
      return "В обработке"
  }
}

export function mediaStatusHint(file: MediaItem): string {
  if (file.status === "failed") {
    return file.errorMessage || "Обработка завершилась ошибкой."
  }

  switch (file.processingStage) {
    case "queued":
      return "Файл уже загружен и ждёт своей очереди на сервере."
    case "processing":
      return "Сервер принял файл и сейчас подготавливает его к обработке."
    case "converting":
      return "Сервер конвертирует и оптимизирует файл. Это может занять несколько минут."
    case "finalizing":
      return "Сервер завершает обработку и сохраняет итоговый вариант."
    default:
      return "Сервер ещё обрабатывает файл. После статуса «Готов» его можно будет выбрать и отредактировать."
  }
}
