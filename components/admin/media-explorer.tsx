"use client"

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import {
  createMediaFolder,
  deleteMediaFolder,
  fetchMediaFolders,
  fetchMediaItems,
  renameMediaFolder,
  updateMediaFolder,
  uploadFolderId,
  type MediaFolderScope,
  type MediaSort,
} from "@/lib/media"
import {
  buildFolderTree,
  collectDescendantIds,
  flattenFolderTree,
  folderPath,
  type MediaFolder,
} from "@/lib/media/folders"
import type { MediaItem, MediaType, UploadedFile } from "@/components/admin/media-uploader"
import { MediaUploader, startUploadFileApi } from "@/components/admin/media-uploader"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { toast } from "sonner"
import { FoldersSidebar } from "@/components/admin/media-explorer/folders-sidebar"
import { MediaBreadcrumbs, MediaToolbar } from "@/components/admin/media-explorer/toolbar"
import { MediaGrid } from "@/components/admin/media-explorer/media-grid"
import { readyMediaItem, type FilterType } from "@/components/admin/media-explorer/status"

/**
 * Медиатека админки — контейнер состояния и работы с API.
 * После разбиения разметка живёт в media-explorer/: сайдбар папок
 * (folders-sidebar), тулбар и крошки (toolbar), сетка карточек (media-grid),
 * статусы и опции (status). Здесь — загрузка, поллинг обработки, CRUD папок
 * и файлов, копирование URL.
 */

export function MediaExplorer({
  onPick,
  lockType,
  allowedTypes,
}: {
  onPick?: (file: UploadedFile) => void
  lockType?: MediaType
  allowedTypes?: MediaType[]
}) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [folderScope, setFolderScope] = useState<MediaFolderScope>("all")
  const [uploaderFiles, setUploaderFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [foldersLoading, setFoldersLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<FilterType>(lockType ?? "all")
  const [sort, setSort] = useState<MediaSort>("createdAt:desc")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copyError, setCopyError] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [uploadBusy, setUploadBusy] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<MediaItem | null>(null)
  const [pendingFolderDelete, setPendingFolderDelete] = useState<MediaFolder | null>(null)
  const [newFolderName, setNewFolderName] = useState("")
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [movingId, setMovingId] = useState<string | null>(null)
  const deferredQuery = useDeferredValue(query.trim())
  const isMountedRef = useRef(true)
  const requestIdRef = useRef(0)

  const pickerTypes = useMemo(
    () => allowedTypes ?? (lockType ? [lockType] : (["image", "video"] as MediaType[])),
    [allowedTypes, lockType],
  )

  const hasProcessingItems = items.some((item) => item.status === "processing")

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  function itemVisibleInCurrentFolder(file: { folderId?: string | null }) {
    return folderScope === "all"
      ? true
      : folderScope === "root"
        ? !file.folderId
        : file.folderId === folderScope
  }

  function upsertItems(nextItems: MediaItem[]) {
    setItems((current) => {
      const nextVisible = nextItems.filter((item) => itemVisibleInCurrentFolder(item))
      const nextIds = new Set(nextItems.map((item) => item.id))
      const rest = current.filter((item) => !nextIds.has(item.id))
      if (sort === "createdAt:asc") {
        return [...rest, ...nextVisible]
      }
      return [...nextVisible, ...rest]
    })
  }

  useEffect(() => {
    setFilter(lockType ?? "all")
  }, [lockType])

  const loadItems = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      const requestId = requestIdRef.current + 1
      requestIdRef.current = requestId

      if (!silent) setLoading(true)

      try {
        const next = await fetchMediaItems({
          type: filter === "all" ? undefined : filter,
          search: deferredQuery || undefined,
          sort,
          folder: folderScope,
        })
        if (!isMountedRef.current || requestId !== requestIdRef.current) return
        setItems(next)
        setLoadError("")
      } catch (error: unknown) {
        if (!isMountedRef.current || requestId !== requestIdRef.current) return
        setLoadError(
          error instanceof Error ? error.message : silent
            ? "Не удалось обновить медиатеку."
            : "Не удалось загрузить медиатеку.",
        )
      } finally {
        if (!silent && isMountedRef.current && requestId === requestIdRef.current) {
          setLoading(false)
        }
      }
    },
    [deferredQuery, filter, folderScope, sort],
  )

  useEffect(() => {
    let active = true
    setFoldersLoading(true)
    fetchMediaFolders()
      .then((next) => {
        if (active) setFolders(next)
      })
      .catch((error: unknown) => {
        if (active) {
          toast.error(error instanceof Error ? error.message : "Не удалось загрузить папки.")
        }
      })
      .finally(() => {
        if (active) setFoldersLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  useEffect(() => {
    if (!hasProcessingItems) return

    const timer = window.setInterval(() => {
      void loadItems({ silent: true })
    }, 3000)

    return () => window.clearInterval(timer)
  }, [hasProcessingItems, loadItems])

  function handleUploaderChange(next: UploadedFile[]) {
    if (next.length) {
      upsertItems(next.map((file) => readyMediaItem(file)))
    }
    setUploaderFiles([])
  }

  function handleUploadAccepted(item: MediaItem) {
    setLoadError("")
    upsertItems([item])
  }

  // Родитель для новой папки = текущая выбранная папка (если это конкретная
  // папка, а не «Все файлы»/«Без папки»).
  const currentFolderId =
    folderScope === "all" || folderScope === "root" ? null : folderScope

  async function handleCreateFolder() {
    const name = newFolderName.trim()
    if (!name || creatingFolder) return
    setCreatingFolder(true)
    try {
      const folder = await createMediaFolder(name, currentFolderId)
      setFolders((current) =>
        [...current, folder].sort((a, b) => a.name.localeCompare(b.name, "ru")),
      )
      setNewFolderName("")
      setFolderScope(folder.id)
      toast.success(`Папка «${folder.name}» создана`)
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Не удалось создать папку.")
    } finally {
      setCreatingFolder(false)
    }
  }

  async function handleRenameFolder(folder: MediaFolder) {
    const next = window.prompt("Новое название папки", folder.name)
    if (next == null) return
    const name = next.trim()
    if (!name || name === folder.name) return
    try {
      const updated = await renameMediaFolder(folder.id, name)
      setFolders((current) =>
        current
          .map((f) => (f.id === updated.id ? updated : f))
          .sort((a, b) => a.name.localeCompare(b.name, "ru")),
      )
      toast.success("Папка переименована")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Не удалось переименовать папку.")
    }
  }

  async function handleDeleteFolder(folder: MediaFolder) {
    try {
      await deleteMediaFolder(folder.id)
      // Сервер удаляет папку вместе с потомками — убираем их и из локального состояния.
      const removed = new Set([folder.id, ...collectDescendantIds(folders, folder.id)])
      setFolders((current) => current.filter((item) => !removed.has(item.id)))
      if (folderScope !== "all" && folderScope !== "root" && removed.has(folderScope)) {
        setFolderScope("all")
      }
      toast.success(`Папка «${folder.name}» удалена`)
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Не удалось удалить папку.")
    }
  }

  async function handleMove(file: MediaItem, nextFolderId: string | null) {
    setMovingId(file.id)
    try {
      const updated = await updateMediaFolder(file.id, nextFolderId)
      setItems((current) => {
        if (folderScope === "all") {
          return current.map((item) => (item.id === updated.id ? updated : item))
        }
        const stays =
          folderScope === "root" ? !updated.folderId : updated.folderId === folderScope
        if (!stays) return current.filter((item) => item.id !== updated.id)
        return current.map((item) => (item.id === updated.id ? updated : item))
      })
      toast.success("Файл перемещён")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Не удалось переместить файл.")
    } finally {
      setMovingId(null)
    }
  }

  async function removeItem(file: MediaItem) {
    setDeleteError("")
    setDeletingId(file.id)
    try {
      const response = await fetch(`/api/media/${encodeURIComponent(file.id)}`, {
        method: "DELETE",
        credentials: "same-origin",
      })
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? "Не удалось удалить файл.")
      }
      setItems((current) => current.filter((item) => item.id !== file.id))
      toast.success(`«${file.name}» удалён`)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Не удалось удалить файл."
      setDeleteError(message)
      toast.error(message)
    } finally {
      setDeletingId(null)
    }
  }

  async function copyUrl(file: MediaItem | UploadedFile) {
    try {
      if (!navigator.clipboard?.writeText) return
      await navigator.clipboard.writeText(file.url)
      setCopyError(false)
      setCopiedId(file.id)
      window.setTimeout(() => setCopiedId((current) => (current === file.id ? null : current)), 1500)
    } catch {
      setCopyError(true)
      window.setTimeout(() => setCopyError(false), 1500)
    }
  }

  function patchItem(next: MediaItem) {
    setItems((current) => current.map((item) => (item.id === next.id ? next : item)))
  }

  const normalizedQuery = query.trim().toLowerCase()
  const filteredItems = useMemo(
    () =>
      items.filter((file) => {
        const matchesQuery = !normalizedQuery || file.name.toLowerCase().includes(normalizedQuery)
        const matchesPickerTypes = !onPick || pickerTypes.includes(file.type)
        const matchesType = (filter === "all" || file.type === filter) && matchesPickerTypes
        return matchesQuery && matchesType
      }),
    [filter, items, normalizedQuery, onPick, pickerTypes],
  )

  const uploadTarget = uploadFolderId(folderScope)

  // Плоский список папок в порядке дерева (с глубиной) — для сайдбара и select'а перемещения.
  const flatFolders = useMemo(
    () => flattenFolderTree(buildFolderTree(folders)),
    [folders],
  )
  // Хлебные крошки текущей папки.
  const breadcrumbs = useMemo(
    () => folderPath(folders, currentFolderId),
    [folders, currentFolderId],
  )

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <FoldersSidebar
        folderScope={folderScope}
        onScopeChange={setFolderScope}
        foldersLoading={foldersLoading}
        flatFolders={flatFolders}
        folders={folders}
        currentFolderId={currentFolderId}
        newFolderName={newFolderName}
        onNewFolderNameChange={setNewFolderName}
        creatingFolder={creatingFolder}
        onCreateFolder={() => void handleCreateFolder()}
        onRenameFolder={(folder) => void handleRenameFolder(folder)}
        onRequestDeleteFolder={setPendingFolderDelete}
      />

      <div className="min-w-0 flex-1 space-y-6">
        <MediaUploader
          mode="multiple"
          value={uploaderFiles}
          onChange={handleUploaderChange}
          uploadFn={(file, onProgress) => startUploadFileApi(file, onProgress, { folderId: uploadTarget })}
          onUploadAccepted={handleUploadAccepted}
          accept={allowedTypes ?? (lockType ? [lockType] : onPick ? ["image", "video"] : undefined)}
          label="Загрузить медиа"
          showLibraryButton={false}
          altMode="library"
          onBusyChange={setUploadBusy}
          folderId={uploadTarget}
        />

        {uploadBusy ? (
          <p className="sr-only" aria-live="assertive">
            Идёт загрузка файлов. Не закрывайте вкладку.
          </p>
        ) : null}

        <MediaBreadcrumbs
          folderScope={folderScope}
          breadcrumbs={breadcrumbs}
          onScopeChange={setFolderScope}
        />

        <MediaToolbar
          query={query}
          onQueryChange={setQuery}
          lockType={lockType}
          filter={filter}
          onFilterChange={setFilter}
          sort={sort}
          onSortChange={setSort}
        />

        {loadError ? (
          <p className="text-sm text-admin-danger" role="alert">
            {loadError}
          </p>
        ) : null}
        {copyError ? (
          <p className="text-sm text-admin-fg-subtle" role="status">
            Не удалось скопировать ссылку.
          </p>
        ) : null}
        {deleteError ? (
          <p className="text-sm text-admin-danger" role="alert">
            {deleteError}
          </p>
        ) : null}

        <MediaGrid
          loading={loading}
          items={items}
          filteredItems={filteredItems}
          flatFolders={flatFolders}
          onPick={onPick}
          copiedId={copiedId}
          deletingId={deletingId}
          pendingDelete={pendingDelete}
          movingId={movingId}
          onCopyUrl={(file) => void copyUrl(file)}
          onMove={(file, nextFolderId) => void handleMove(file, nextFolderId)}
          onRequestDelete={setPendingDelete}
          onItemPatched={patchItem}
        />
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Удалить файл?"
        message={
          pendingDelete
            ? `«${pendingDelete.name}» будет удалён из медиатеки и с хранилища. Это нельзя отменить.`
            : ""
        }
        confirmLabel="Удалить"
        tone="danger"
        pending={deletingId === pendingDelete?.id}
        onCancel={() => {
          if (!deletingId) setPendingDelete(null)
        }}
        onConfirm={() => {
          if (!pendingDelete) return
          void removeItem(pendingDelete).finally(() => setPendingDelete(null))
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingFolderDelete)}
        title="Удалить папку?"
        message={
          pendingFolderDelete
            ? `«${pendingFolderDelete.name}» и все вложенные в неё папки будут удалены. Файлы из них останутся в «Без папки».`
            : ""
        }
        confirmLabel="Удалить"
        tone="danger"
        onCancel={() => setPendingFolderDelete(null)}
        onConfirm={() => {
          if (!pendingFolderDelete) return
          const folder = pendingFolderDelete
          setPendingFolderDelete(null)
          void handleDeleteFolder(folder)
        }}
      />
    </div>
  )
}
