"use client"

import { Folder, FolderPlus, LoaderCircle, Pencil, Trash2 } from "lucide-react"
import { isImeComposing } from "@/lib/ime"
import type { MediaFolderScope } from "@/lib/media"
import type { MediaFolder } from "@/lib/media/folders"
import { IconButton, Input } from "@/components/admin/ui"
import { cn } from "@/lib/utils"

/**
 * Сайдбар папок медиатеки, выделенный из media-explorer.tsx.
 * Только отображение и локальные обработчики — состояние и работа с API
 * остаются в родительском MediaExplorer.
 */

export function FoldersSidebar({
  folderScope,
  onScopeChange,
  foldersLoading,
  flatFolders,
  folders,
  currentFolderId,
  newFolderName,
  onNewFolderNameChange,
  creatingFolder,
  onCreateFolder,
  onRenameFolder,
  onRequestDeleteFolder,
}: {
  folderScope: MediaFolderScope
  onScopeChange: (scope: MediaFolderScope) => void
  foldersLoading: boolean
  flatFolders: Array<MediaFolder & { depth: number }>
  folders: MediaFolder[]
  currentFolderId: string | null
  newFolderName: string
  onNewFolderNameChange: (value: string) => void
  creatingFolder: boolean
  onCreateFolder: () => void
  onRenameFolder: (folder: MediaFolder) => void
  onRequestDeleteFolder: (folder: MediaFolder) => void
}) {
  return (
    <aside className="w-full shrink-0 space-y-3 lg:w-56">
      <p className="text-xs font-semibold uppercase tracking-wide text-admin-fg-subtle">Папки</p>
      <nav className="space-y-1" aria-label="Папки медиатеки">
        <FolderNavButton
          active={folderScope === "all"}
          onClick={() => onScopeChange("all")}
          label="Все файлы"
        />
        <FolderNavButton
          active={folderScope === "root"}
          onClick={() => onScopeChange("root")}
          label="Без папки"
        />
        {foldersLoading ? (
          <p className="flex items-center gap-2 px-2 py-1.5 text-sm text-admin-fg-muted">
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            Загрузка…
          </p>
        ) : (
          flatFolders.map((folder) => (
            <div key={folder.id} className="group flex items-center gap-1">
              <FolderNavButton
                active={folderScope === folder.id}
                onClick={() => onScopeChange(folder.id)}
                label={folder.name}
                depth={folder.depth}
                className="min-w-0 flex-1"
              />
              <IconButton
                type="button"
                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                aria-label={`Переименовать папку ${folder.name}`}
                onClick={() => onRenameFolder(folder)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </IconButton>
              <IconButton
                type="button"
                tone="danger"
                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                aria-label={`Удалить папку ${folder.name}`}
                onClick={() => onRequestDeleteFolder(folder)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </IconButton>
            </div>
          ))
        )}
      </nav>
      <div className="space-y-1.5">
        <p className="text-xs text-admin-fg-subtle">
          {currentFolderId
            ? `Новая папка внутри: «${folders.find((f) => f.id === currentFolderId)?.name ?? "…"}»`
            : "Новая папка в корне"}
        </p>
        <div className="flex gap-2">
          <Input
            value={newFolderName}
            onChange={(event) => onNewFolderNameChange(event.target.value)}
            placeholder="Новая папка"
            aria-label="Название новой папки"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !isImeComposing(event)) {
                event.preventDefault()
                onCreateFolder()
              }
            }}
          />
          <IconButton
            type="button"
            onClick={onCreateFolder}
            disabled={creatingFolder || !newFolderName.trim()}
            aria-label="Создать папку"
          >
            {creatingFolder ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <FolderPlus className="h-4 w-4" />
            )}
          </IconButton>
        </div>
      </div>
    </aside>
  )
}

function FolderNavButton({
  active,
  onClick,
  label,
  depth = 0,
  className,
}: {
  active: boolean
  onClick: () => void
  label: string
  depth?: number
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={depth ? { paddingLeft: `${0.5 + depth * 0.85}rem` } : undefined}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
        active
          ? "bg-admin-muted font-medium text-admin-fg"
          : "text-admin-fg-muted hover:bg-admin-muted/60 hover:text-admin-fg",
        className,
      )}
    >
      <Folder className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  )
}
