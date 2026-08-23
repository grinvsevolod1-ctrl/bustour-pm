"use client"

// API-слой загрузчика медиа: XHR-загрузка с прогрессом, ожидание обработки
// на сервере и вспомогательные функции. Вынесен из media-uploader.tsx —
// здесь нет React-состояния, только сетевые вызовы и чистые функции.
import { extToType, extensionsByType, mimeTypesByType } from "@/lib/media/utils"
import type { MediaItem, UploadedFile } from "@/lib/media/types"
import { toUploadedFile } from "@/lib/media/types"

export type MediaType = UploadedFile["type"]

export type PendingUpload = {
  id: string
  name: string
  sizeLabel: string
  /** 0–100; -1 = indeterminate until first progress event */
  progress: number
  /** Shown while progress is indeterminate or as status prefix */
  stage: "prepare" | "compress" | "upload" | "process"
}

export function uploadedFileFromUrl(url: string): UploadedFile {
  const cleanUrl = url.split(/[?#]/, 1)[0]
  const rawName = cleanUrl.slice(cleanUrl.lastIndexOf("/") + 1)
  let name = rawName || "Медиа"

  try {
    name = decodeURIComponent(name)
  } catch {
    // Keep the raw basename when the URL contains malformed encoding.
  }

  return {
    id: url,
    url,
    name,
    size: "",
    type: extToType(cleanUrl) ?? "image",
  }
}

export async function waitForReadyMedia(id: string, timeoutMs = 10 * 60_000): Promise<UploadedFile> {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    const response = await fetch(`/api/media/${encodeURIComponent(id)}`, {
      credentials: "same-origin",
    })
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      throw new Error(payload?.error ?? "Не удалось дождаться обработки файла.")
    }
    const payload = (await response.json().catch(() => null)) as MediaItem | null
    if (!payload) throw new Error("Файл не найден.")
    if (payload.status === "ready") return toUploadedFile(payload)
    if (payload.status === "failed") {
      throw new Error(payload.errorMessage || "Не удалось обработать файл.")
    }
    await new Promise((resolve) => window.setTimeout(resolve, 1500))
  }

  throw new Error("Сервер слишком долго обрабатывает файл. Проверьте медиатеку позже.")
}

/** XHR upload so we can show real byte progress (fetch has no upload progress). */
export function startUploadFileApi(
  file: File,
  onProgress?: (ratio: number) => void,
  opts?: { folderId?: string | null },
): Promise<MediaItem> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", "/api/media/upload")
    xhr.withCredentials = true
    xhr.responseType = "json"
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress?.(event.loaded / event.total)
      }
    }
    xhr.onload = () => {
      const payload = xhr.response as MediaItem | { error?: string } | null
      if (xhr.status >= 200 && xhr.status < 300 && payload && "id" in payload) {
        onProgress?.(1)
        resolve(payload)
        return
      }
      const message =
        payload && typeof payload === "object" && "error" in payload && payload.error
          ? payload.error
          : "Не удалось загрузить файл."
      reject(new Error(message))
    }
    xhr.onerror = () => reject(new Error("Сеть недоступна. Проверьте соединение и попробуйте снова."))
    xhr.onabort = () => reject(new Error("Загрузка отменена."))
    const formData = new FormData()
    formData.append("file", file)
    if (opts?.folderId) formData.append("folderId", opts.folderId)
    xhr.send(formData)
  })
}

export async function uploadFileApi(
  file: File,
  onProgress?: (ratio: number) => void,
  opts?: { folderId?: string | null },
): Promise<UploadedFile> {
  const item = await startUploadFileApi(file, onProgress, opts)
  if (item.status === "ready") return toUploadedFile(item)
  return waitForReadyMedia(item.id)
}

export function revokeObjectUrl(url: string) {
  if (url.startsWith("blob:")) URL.revokeObjectURL(url)
}

export function fileAcceptValue(types: MediaType[]) {
  return types
    .flatMap((type) => [...extensionsByType[type], ...mimeTypesByType[type]])
    .join(",")
}
