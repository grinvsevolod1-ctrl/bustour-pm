"use client"

// Плитки загрузчика: галерея уже прикреплённых файлов (с DnD-перестановкой
// и alt-полями) и очередь загружаемых файлов с прогрессом. Вынесено из
// media-uploader.tsx — разметка без собственного состояния, всё через props.
import { ChevronDown, ChevronUp, GripVertical, LoaderCircle, X } from "lucide-react"
import { IconButton } from "@/components/admin/ui"
import { MediaThumbnail } from "@/components/admin/media-thumbnail"
import { MediaAltField } from "@/components/admin/media-alt-field"
import { InstanceAltField } from "@/components/admin/instance-alt-field"
import { cn } from "@/lib/utils"
import type { UploadedFile } from "@/lib/media/types"
import type { PendingUpload } from "@/components/admin/media-uploader/upload-api"

type AltMode = "library" | "instance" | "none"

export function UploadedTile({
  file,
  index,
  filesCount,
  canReorder,
  altMode,
  dragIndex,
  dragOverIndex,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onReorder,
  onRemove,
  onPatch,
}: {
  file: UploadedFile
  index: number
  filesCount: number
  canReorder: boolean
  altMode: AltMode
  dragIndex: number | null
  dragOverIndex: number | null
  onDragStart: (index: number) => void
  onDragOver: (index: number) => void
  onDrop: (index: number) => void
  onDragEnd: () => void
  onReorder: (from: number, to: number) => void
  onRemove: (index: number) => void
  onPatch: (index: number, next: UploadedFile) => void
}) {
  return (
    <div
      draggable={canReorder}
      onDragStart={() => {
        if (!canReorder) return
        onDragStart(index)
      }}
      onDragOver={(event) => {
        if (!canReorder || dragIndex === null) return
        event.preventDefault()
        onDragOver(index)
      }}
      onDrop={(event) => {
        if (!canReorder) return
        event.preventDefault()
        onDrop(index)
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "relative w-56 max-w-full overflow-hidden rounded-lg border bg-white",
        canReorder && dragOverIndex === index && dragIndex !== index
          ? "border-admin-fg bg-admin-muted/40"
          : "border-admin-border",
      )}
    >
      {canReorder ? (
        <div className="absolute left-2 top-2 z-10 flex items-center gap-0.5">
          <span
            className="cursor-grab rounded bg-white/90 p-1 text-admin-fg-subtle active:cursor-grabbing"
            aria-label="Перетащить"
            title="Перетащить"
          >
            <GripVertical className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="flex flex-col rounded bg-white/90">
            <IconButton
              type="button"
              className="h-5 w-6"
              disabled={index === 0}
              onClick={() => onReorder(index, index - 1)}
              aria-label="Выше"
            >
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            </IconButton>
            <IconButton
              type="button"
              className="h-5 w-6"
              disabled={index === filesCount - 1}
              onClick={() => onReorder(index, index + 1)}
              aria-label="Ниже"
            >
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </IconButton>
          </div>
        </div>
      ) : null}
      <IconButton
        type="button"
        tone="danger"
        className="absolute right-2 top-2 z-10 bg-white/90"
        onClick={() => onRemove(index)}
        aria-label={`Удалить ${file.name}`}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </IconButton>
      <MediaThumbnail file={file} />
      {altMode === "library" ? (
        <MediaAltField file={file} onSaved={(next) => onPatch(index, next)} />
      ) : altMode === "instance" ? (
        <InstanceAltField file={file} onChange={(next) => onPatch(index, next)} />
      ) : null}
    </div>
  )
}

export function PendingTile({ pending }: { pending: PendingUpload }) {
  const pct = pending.progress < 0 ? null : pending.progress
  return (
    <div
      className="relative w-56 max-w-full overflow-hidden rounded-lg border border-admin-border bg-white"
      aria-busy="true"
    >
      <div
        className={cn(
          "flex h-36 flex-col items-center justify-center gap-2 bg-admin-muted/60 px-3",
          pct === null && "motion-safe:animate-pulse",
        )}
      >
        <LoaderCircle
          className="h-7 w-7 text-admin-fg motion-safe:animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
        <span className="text-xs font-medium tabular-nums text-admin-fg">
          {pending.stage === "process"
            ? "Контент в обработке"
            : pct === null
              ? pending.stage === "compress"
                ? "Сжатие…"
                : pending.stage === "upload"
                  ? "Загрузка…"
                  : "Подготовка…"
              : `${pct}%`}
        </span>
      </div>
      <div className="space-y-1.5 border-t border-admin-border p-3">
        <p className="truncate text-sm font-medium text-admin-fg" title={pending.name}>
          {pending.name}
        </p>
        <p className="text-xs text-admin-fg-subtle">{pending.sizeLabel}</p>
        <div
          className="h-1 overflow-hidden rounded-full bg-admin-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct ?? undefined}
          aria-label={`Прогресс «${pending.name}»`}
        >
          <div
            className={cn(
              "h-full rounded-full bg-admin-fg transition-[width] duration-200 ease-out motion-reduce:transition-none",
              pct === null && "w-1/3 motion-safe:animate-pulse",
            )}
            style={pct === null ? undefined : { width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
