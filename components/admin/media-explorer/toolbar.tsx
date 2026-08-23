"use client"

import { ChevronRight, Search } from "lucide-react"
import type { MediaFolderScope, MediaSort } from "@/lib/media"
import type { MediaType } from "@/components/admin/media-uploader"
import type { MediaFolder } from "@/lib/media/folders"
import { Input, Select } from "@/components/admin/ui"
import { filterOptions, sortOptions, type FilterType } from "@/components/admin/media-explorer/status"

/**
 * Тулбар медиатеки (поиск, фильтр по типу, сортировка) и хлебные крошки папок,
 * выделенные из media-explorer.tsx. Состояние остаётся в MediaExplorer.
 */

export function MediaBreadcrumbs({
  folderScope,
  breadcrumbs,
  onScopeChange,
}: {
  folderScope: MediaFolderScope
  breadcrumbs: MediaFolder[]
  onScopeChange: (scope: MediaFolderScope) => void
}) {
  if (folderScope === "all") return null
  return (
    <nav
      className="flex flex-wrap items-center gap-1 text-sm text-admin-fg-muted"
      aria-label="Хлебные крошки папок"
    >
      <button
        type="button"
        onClick={() => onScopeChange("all")}
        className="rounded px-1.5 py-0.5 hover:bg-admin-muted/60 hover:text-admin-fg"
      >
        Все файлы
      </button>
      {folderScope === "root" ? (
        <>
          <ChevronRight className="h-3.5 w-3.5 text-admin-fg-subtle" />
          <span className="px-1.5 py-0.5 font-medium text-admin-fg">Без папки</span>
        </>
      ) : (
        breadcrumbs.map((crumb, index) => (
          <span key={crumb.id} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-admin-fg-subtle" />
            {index === breadcrumbs.length - 1 ? (
              <span className="px-1.5 py-0.5 font-medium text-admin-fg">{crumb.name}</span>
            ) : (
              <button
                type="button"
                onClick={() => onScopeChange(crumb.id)}
                className="rounded px-1.5 py-0.5 hover:bg-admin-muted/60 hover:text-admin-fg"
              >
                {crumb.name}
              </button>
            )}
          </span>
        ))
      )}
    </nav>
  )
}

export function MediaToolbar({
  query,
  onQueryChange,
  lockType,
  filter,
  onFilterChange,
  sort,
  onSortChange,
}: {
  query: string
  onQueryChange: (value: string) => void
  lockType?: MediaType
  filter: FilterType
  onFilterChange: (value: FilterType) => void
  sort: MediaSort
  onSortChange: (value: MediaSort) => void
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-fg-subtle" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Поиск по имени файла"
          className="pl-9"
          aria-label="Поиск по имени файла"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {lockType ? (
          <p className="self-center text-sm text-admin-fg-muted">
            Фильтр: {filterOptions.find((option) => option.value === lockType)?.label}
          </p>
        ) : (
          <Select
            value={filter}
            onChange={(event) => onFilterChange(event.target.value as FilterType)}
            className="sm:w-44"
            aria-label="Фильтр по типу"
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        )}
        <Select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as MediaSort)}
          className="sm:w-44"
          aria-label="Сортировка"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  )
}
