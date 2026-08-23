"use client"

// Контейнер загрузчика медиа: держит состояние очереди/DnD и оркеструет
// загрузку. Разметка вынесена в media-uploader/{upload-banners,file-tiles},
// сетевой слой — в media-uploader/upload-api.
import { useEffect, useId, useRef, useState } from "react"
import { FolderOpen, Upload } from "lucide-react"
import { toast } from "sonner"
import { Alert, Label } from "@/components/admin/ui"
import { detectType, extensionsByType, formatBytes, mimeTypesByType, MAX_MEDIA_SIZE_MB } from "@/lib/media/utils"
import { cn } from "@/lib/utils"
import { MediaPickerDialog } from "@/components/admin/media-picker-dialog"
import { moveMediaAt, patchMediaAt, removeMediaAt } from "@/lib/media/list"
import { sha256HexFromBlob } from "@/lib/media/checksum"
import { encodeImageFileToWebp } from "@/lib/browser-webp"
import type { MediaItem, UploadedFile } from "@/lib/media/types"
import { isMediaReady, toUploadedFile } from "@/lib/media/types"
import {
  fileAcceptValue,
  revokeObjectUrl,
  uploadFileApi,
  waitForReadyMedia,
  type PendingUpload,
} from "@/components/admin/media-uploader/upload-api"
import { ProcessingBanner, TransferBusyBanner } from "@/components/admin/media-uploader/upload-banners"
import { PendingTile, UploadedTile } from "@/components/admin/media-uploader/file-tiles"

export type MediaType = UploadedFile["type"]
export type { MediaItem, UploadedFile } from "@/lib/media/types"
export { detectType, extToType, formatBytes } from "@/lib/media/utils"
export {
  startUploadFileApi,
  uploadFileApi,
  uploadedFileFromUrl,
} from "@/components/admin/media-uploader/upload-api"

type MediaUploaderBaseProps = {
  accept?: MediaType[]
  maxSizeMB?: number
  label?: string
  className?: string
  uploadFn?: (file: File, onProgress?: (ratio: number) => void) => Promise<UploadedFile | MediaItem>
  showLibraryButton?: boolean
  /** library = PATCH defaultAlt; instance = local customAlt; none = hide. */
  altMode?: "library" | "instance" | "none"
  /** Fires when upload queue becomes busy / idle (page banners, beforeunload helpers). */
  onBusyChange?: (busy: boolean) => void
  /** Assign new uploads to this flat folder (ignored when custom uploadFn is set). */
  folderId?: string | null
  /** Fires when server has accepted the file into media library, even if processing is still running. */
  onUploadAccepted?: (item: MediaItem) => void
}

type SingleMediaUploaderProps = MediaUploaderBaseProps & {
  mode?: "single"
  value: UploadedFile | null
  onChange: (next: UploadedFile | null) => void
}

type MultipleMediaUploaderProps = MediaUploaderBaseProps & {
  mode: "multiple"
  value: UploadedFile[]
  onChange: (next: UploadedFile[]) => void
}

export type MediaUploaderProps = SingleMediaUploaderProps | MultipleMediaUploaderProps

const allTypes: MediaType[] = ["image", "video", "document"]

export function MediaUploader(props: MediaUploaderProps) {
  const mode = props.mode ?? "single"
  const {
    accept = allTypes,
    maxSizeMB = MAX_MEDIA_SIZE_MB,
    label = "Файлы",
    className,
    uploadFn: uploadFnProp,
    showLibraryButton = true,
    altMode = "instance",
    onBusyChange,
    folderId = null,
    onUploadAccepted,
  } = props
  const uploadFn =
    uploadFnProp ??
    ((file: File, onProgress?: (ratio: number) => void) =>
      uploadFileApi(file, onProgress, { folderId }))
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const valueRef = useRef(props.value)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState("")
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([])
  const [libraryOpen, setLibraryOpen] = useState(false)
  // ponytail: native HTML5 DnD by index — same pattern as TourLayoutBuilder
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  // ponytail: no confirm modal — auto-reuse so form fields (e.g. tour cover) fill without a click
  const transferBusy = pendingUploads.some((item) => item.stage !== "process")
  const busy = pendingUploads.length > 0

  valueRef.current = props.value

  async function lookupByChecksum(checksum: string): Promise<MediaItem | null> {
    const response = await fetch(`/api/media/by-checksum?checksum=${encodeURIComponent(checksum)}`, {
      credentials: "same-origin",
    })
    if (!response.ok) return null
    const payload = (await response.json().catch(() => null)) as { existing?: MediaItem | null } | null
    return payload?.existing ?? null
  }

  useEffect(() => {
    return () => {
      const current = valueRef.current
      if (Array.isArray(current)) {
        current.forEach((file) => revokeObjectUrl(file.url))
      } else if (current) {
        revokeObjectUrl(current.url)
      }
    }
  }, [])

  useEffect(() => {
    onBusyChange?.(transferBusy)
  }, [transferBusy, onBusyChange])

  useEffect(() => {
    if (!transferBusy) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [transferBusy])

  const files = props.mode === "multiple" ? props.value : props.value ? [props.value] : []

  function removeFile(index: number) {
    // Detach from form only — physical delete is Media Library (explorer) DELETE.
    // Remove by slot index: checksum dedupe returns the same media.id for identical files.
    if (props.mode === "multiple") {
      const file = props.value[index]
      if (file) revokeObjectUrl(file.url)
      props.onChange(removeMediaAt(props.value, index))
    } else {
      if (props.value) revokeObjectUrl(props.value.url)
      props.onChange(null)
    }
  }

  function patchFile(index: number, next: UploadedFile) {
    if (props.mode === "multiple") {
      props.onChange(patchMediaAt(props.value, index, next))
    } else {
      props.onChange(next)
    }
  }

  function reorderFile(from: number, to: number) {
    if (props.mode !== "multiple") return
    props.onChange(moveMediaAt(props.value, from, to))
  }

  function dropAt(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    reorderFile(dragIndex, targetIndex)
    setDragIndex(null)
    setDragOverIndex(null)
  }

  async function handleFiles(selectedFiles: File[]) {
    setError("")
    const filesToUpload = mode === "single" ? selectedFiles.slice(0, 1) : selectedFiles
    const rejected: string[] = []
    const validFiles = filesToUpload.filter((file) => {
      const type = detectType(file)
      if (!type || !accept.includes(type)) {
        rejected.push(`«${file.name}»: неподдерживаемый тип.`)
        return false
      }
      if (maxSizeMB !== undefined && file.size > maxSizeMB * 1024 * 1024) {
        rejected.push(`«${file.name}»: размер больше ${maxSizeMB} МБ.`)
        return false
      }
      return true
    })

    if (rejected.length) {
      const message = rejected.join(" ")
      setError(message)
      toast.error(message)
    }
    if (!validFiles.length) return

    const toastId = toast.loading(
      validFiles.length === 1
        ? `Загрузка «${validFiles[0]!.name}»…`
        : `Загрузка ${validFiles.length} файлов…`,
    )

    const accepted: UploadedFile[] = []
    let reused = 0
    let queued = 0
    let failed: string | null = null

    try {
      for (let index = 0; index < validFiles.length; index++) {
        const file = validFiles[index]!
        const pendingId = `${file.name}-${file.size}-${file.lastModified}-${index}-${Date.now()}`
        setPendingUploads((current) => [
          ...current,
          {
            id: pendingId,
            name: file.name,
            sizeLabel: formatBytes(file.size),
            progress: -1,
            stage: "prepare",
          },
        ])

        try {
          const kind = detectType(file)
          setPendingUploads((current) =>
            current.map((item) =>
              item.id === pendingId ? { ...item, stage: "compress", progress: -1 } : item,
            ),
          )
          // Client WebP+resize when sharp may be skipped on server; video convert is server-side (ffmpeg).
          const prepared = kind === "image" ? await encodeImageFileToWebp(file) : file
          const checksum = await sha256HexFromBlob(prepared)
          const existing = await lookupByChecksum(checksum)
          if (existing) {
            onUploadAccepted?.(existing)
            if (isMediaReady(existing)) {
              accepted.push(toUploadedFile(existing))
              reused += 1
            } else if (!onUploadAccepted) {
              accepted.push(await waitForReadyMedia(existing.id))
            } else {
              queued += 1
            }
            continue
          }

          setPendingUploads((current) =>
            current.map((item) =>
              item.id === pendingId ? { ...item, stage: "upload", progress: 0 } : item,
            ),
          )
          const uploaded = await uploadFn(prepared, (ratio) => {
            const pct = Math.round(Math.min(1, Math.max(0, ratio)) * 100)
            const reachedFinal = ratio >= 1
            setPendingUploads((current) =>
              current.map((item) =>
                item.id === pendingId
                  ? { ...item, stage: reachedFinal ? "process" : "upload", progress: pct }
                  : item,
              ),
            )
          })
          onUploadAccepted?.({
            ...toUploadedFile(uploaded),
            status: "status" in uploaded ? uploaded.status : "ready",
            processingStage: "status" in uploaded ? uploaded.processingStage : "ready",
            errorMessage: "status" in uploaded ? uploaded.errorMessage ?? null : null,
            mimeType: "status" in uploaded ? uploaded.mimeType ?? "" : "",
          })
          if (isMediaReady(uploaded)) accepted.push(toUploadedFile(uploaded))
          else if (!onUploadAccepted) accepted.push(await waitForReadyMedia(uploaded.id))
          else queued += 1
        } catch (error: unknown) {
          failed = error instanceof Error ? error.message : "Не удалось загрузить файл."
          break
        } finally {
          setPendingUploads((current) => current.filter((item) => item.id !== pendingId))
        }
      }

      if (accepted.length) {
        if (props.mode === "multiple") {
          props.onChange([...props.value, ...accepted])
        } else {
          if (props.value) revokeObjectUrl(props.value.url)
          props.onChange(accepted[accepted.length - 1] ?? null)
        }
      }

      if (failed) {
        setError(failed)
        toast.error(failed, { id: toastId })
      } else if (accepted.length === 0 && queued === 0) {
        toast.message("Загрузка отменена", { id: toastId })
      } else if (reused === accepted.length) {
        toast.success(
          accepted.length === 1
            ? `«${accepted[0]!.name}» — из медиатеки`
            : `Из медиатеки: ${accepted.length}`,
          { id: toastId },
        )
      } else if (queued > 0 && accepted.length === 0) {
        toast.success(
          queued === 1
            ? `Файл поставлен в обработку`
            : `Файлов в обработке: ${queued}`,
          { id: toastId },
        )
      } else if (queued > 0) {
        toast.success(`Готово: ${accepted.length}, в обработке: ${queued}`, { id: toastId })
      } else {
        toast.success(
          accepted.length === 1 ? `«${accepted[0]!.name}» готов` : `Готово файлов: ${accepted.length}`,
          { id: toastId },
        )
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Не удалось загрузить файл."
      setError(message)
      toast.error(message, { id: toastId })
    }
  }

  function handleLibraryPick(file: UploadedFile) {
    if (props.mode === "multiple") {
      props.onChange([...props.value, file])
    } else {
      if (props.value) revokeObjectUrl(props.value.url)
      props.onChange(file)
    }
    setLibraryOpen(false)
  }

  return (
    <div className={cn("space-y-3", className)}>
      {label ? <Label htmlFor={inputId}>{label}</Label> : null}

      {transferBusy ? <TransferBusyBanner pendingUploads={pendingUploads} /> : null}

      {pendingUploads.some((item) => item.stage === "process") ? <ProcessingBanner /> : null}

      <div className="flex flex-wrap items-stretch gap-3">
        <div
          className={cn(
            "min-w-0 flex-1 flex-wrap gap-3",
            files.length || pendingUploads.length ? "flex" : "hidden",
          )}
        >
          {files.map((file, index) => (
            <UploadedTile
              key={`${file.id}::${index}`}
              file={file}
              index={index}
              filesCount={files.length}
              canReorder={mode === "multiple" && files.length > 1}
              altMode={altMode}
              dragIndex={dragIndex}
              dragOverIndex={dragOverIndex}
              onDragStart={(idx) => {
                setDragIndex(idx)
                setDragOverIndex(idx)
              }}
              onDragOver={setDragOverIndex}
              onDrop={dropAt}
              onDragEnd={() => {
                setDragIndex(null)
                setDragOverIndex(null)
              }}
              onReorder={reorderFile}
              onRemove={removeFile}
              onPatch={patchFile}
            />
          ))}

          {pendingUploads.map((pending) => (
            <PendingTile key={pending.id} pending={pending} />
          ))}
        </div>

        <div className="grid min-w-0 flex-1 basis-full grid-cols-1 gap-3 lg:basis-0 lg:grid-cols-2">
          <div
            role="button"
            tabIndex={0}
            aria-busy={busy}
            className={cn(
              "flex min-h-28 w-full min-w-0 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-2 text-center transition-colors",
              dragging
                ? "border-admin-fg bg-admin-muted"
                : "border-admin-border bg-admin-muted/40 hover:border-admin-fg-muted hover:bg-admin-muted",
              busy && "ring-2 ring-amber-300/60 ring-offset-1",
            )}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                inputRef.current?.click()
              }
            }}
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragging(false)
              void handleFiles(Array.from(event.dataTransfer.files))
            }}
          >
            <Upload className="mb-1 h-4 w-4 text-admin-fg-muted" aria-hidden="true" />
            <span className="text-[10px] font-medium leading-tight text-admin-fg">
              {busy ? "Добавить ещё в очередь…" : "Перетащите файлы сюда или выберите их"}
            </span>
            <span className="mt-1 break-words text-[9px] leading-tight text-admin-fg-subtle">
              {accept.flatMap((type) => extensionsByType[type]).join(", ")}
            </span>
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              className="sr-only"
              accept={fileAcceptValue(accept)}
              multiple={mode === "multiple"}
              onChange={(event) => {
                void handleFiles(Array.from(event.target.files ?? []))
                event.currentTarget.value = ""
              }}
            />
          </div>

          {showLibraryButton ? (
            <>
              <button
                type="button"
                onClick={() => setLibraryOpen(true)}
                disabled={busy}
                className="flex min-h-28 w-full min-w-0 flex-col items-center justify-center gap-1 rounded-lg border border-admin-border p-2 text-center text-[10px] leading-tight text-admin-fg-muted transition-colors hover:bg-admin-muted hover:text-admin-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-ring disabled:opacity-50"
              >
                <FolderOpen className="h-5 w-5" aria-hidden="true" />
                Выбрать из загруженных
              </button>
              <MediaPickerDialog
                open={libraryOpen}
                allowedTypes={accept}
                onPick={handleLibraryPick}
                onClose={() => setLibraryOpen(false)}
              />
            </>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="text-sm text-admin-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
