"use client"

import { Images, LoaderCircle, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { MediaItem, UploadedFile } from "@/components/admin/media-uploader"
import { MediaThumbnail } from "@/components/admin/media-thumbnail"
import { MediaAltField } from "@/components/admin/media-alt-field"
import { EmptyState, IconButton, Select } from "@/components/admin/ui"
import { cn } from "@/lib/utils"
import { isMediaReady, toUploadedFile } from "@/lib/media/types"
import type { MediaFolder } from "@/lib/media/folders"
import { mediaStatusHint, mediaStatusLabel } from "@/components/admin/media-explorer/status"

/**
 * Сетка карточек медиатеки, выделенная из media-explorer.tsx.
 * Карточка: превью, статус обработки, перемещение по папкам, alt-поле,
 * выбор (onPick) или копирование URL. Состояние остаётся в MediaExplorer.
 */

function notReadyMessage(file: MediaItem) {
  toast.message(
    file.status === "failed"
      ? "Этот файл не готов: обработка завершилась ошибкой."
      : "Файл ещё обрабатывается и пока недоступен для выбора.",
  )
}

export function MediaGrid({
  loading,
  items,
  filteredItems,
  flatFolders,
  onPick,
  copiedId,
  deletingId,
  pendingDelete,
  movingId,
  onCopyUrl,
  onMove,
  onRequestDelete,
  onItemPatched,
}: {
  loading: boolean
  items: MediaItem[]
  filteredItems: MediaItem[]
  flatFolders: Array<MediaFolder & { depth: number }>
  onPick?: (file: UploadedFile) => void
  copiedId: string | null
  deletingId: string | null
  pendingDelete: MediaItem | null
  movingId: string | null
  onCopyUrl: (file: MediaItem) => void
  onMove: (file: MediaItem, nextFolderId: string | null) => void
  onRequestDelete: (file: MediaItem) => void
  onItemPatched: (next: MediaItem) => void
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-admin-fg-muted">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        Загружаем медиатеку…
      </div>
    )
  }

  if (filteredItems.length === 0) {
    return (
      <EmptyState
        title="Медиафайлы не найдены"
        description={items.length ? "Измените поиск или фильтр." : "Загрузите первый файл, чтобы он появился здесь."}
      >
        <Images className="mx-auto mt-3 h-8 w-8 text-admin-fg-subtle" />
      </EmptyState>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filteredItems.map((file) => (
        <div
          key={file.id}
          role="button"
          tabIndex={0}
          className={cn(
            "relative overflow-hidden rounded-lg border border-admin-border bg-white text-left transition-colors",
            onPick && !isMediaReady(file)
              ? "cursor-not-allowed opacity-80"
              : "cursor-pointer hover:border-admin-fg-muted hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-ring",
          )}
          onClick={() => {
            if (onPick) {
              if (!isMediaReady(file)) {
                notReadyMessage(file)
                return
              }
              onPick(toUploadedFile(file))
              return
            }
            onCopyUrl(file)
          }}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              if (onPick) {
                if (!isMediaReady(file)) {
                  notReadyMessage(file)
                  return
                }
                onPick(toUploadedFile(file))
              } else onCopyUrl(file)
            }
          }}
          title={onPick ? "Выбрать файл" : "Нажмите, чтобы скопировать URL"}
        >
          <div className="absolute left-2 top-2 z-10 rounded bg-white/90 px-2 py-1 text-[11px] font-medium text-admin-fg">
            {mediaStatusLabel(file)}
          </div>
          <IconButton
            type="button"
            tone="danger"
            className="absolute right-2 top-2 z-10 bg-white/90"
            onClick={(event) => {
              event.stopPropagation()
              onRequestDelete(file)
            }}
            aria-label={`Удалить ${file.name}`}
            disabled={deletingId === file.id || Boolean(pendingDelete) || file.status === "processing"}
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
          <MediaThumbnail file={file} />
          <div className="space-y-2 border-t border-admin-border px-3 py-2" onClick={(e) => e.stopPropagation()}>
            <Select
              value={file.folderId ?? "root"}
              disabled={movingId === file.id}
              aria-label={`Папка для ${file.name}`}
              onChange={(event) => {
                const value = event.target.value
                onMove(file, value === "root" ? null : value)
              }}
            >
              <option value="root">Без папки</option>
              {flatFolders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {`${"\u00A0\u00A0".repeat(folder.depth)}${folder.name}`}
                </option>
              ))}
            </Select>
          </div>
          {isMediaReady(file) ? <MediaAltField file={file} onSaved={(next) => onItemPatched(next)} /> : (
            <div className="border-t border-admin-border px-3 py-2 text-xs text-admin-fg-subtle">
              {mediaStatusHint(file)}
            </div>
          )}
          {copiedId === file.id ? (
            <div className="absolute inset-x-0 bottom-0 bg-admin-fg/85 px-3 py-2 text-center text-xs font-medium text-white">
              Скопировано
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
