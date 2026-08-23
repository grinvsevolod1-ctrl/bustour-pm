"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import type { MediaItem, UploadedFile } from "@/components/admin/media-uploader"
import { isImeComposing } from "@/lib/ime"
import { isPersistedMediaId, updateMediaAlt, updateMediaAuthor } from "@/lib/media"
import { Input } from "@/components/admin/ui"

/** Compact alt + author editor for persisted library images. */
export function MediaAltField({
  file,
  onSaved,
}: {
  file: UploadedFile | MediaItem
  onSaved?: (next: MediaItem) => void
}) {
  const [value, setValue] = useState(file.alt ?? "")
  const [authorValue, setAuthorValue] = useState(file.author ?? "")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setValue(file.alt ?? "")
  }, [file.id, file.alt])

  useEffect(() => {
    setAuthorValue(file.author ?? "")
  }, [file.id, file.author])

  if (file.type !== "image" || !isPersistedMediaId(file.id)) return null

  async function save() {
    const nextAlt = value.trim()
    if (nextAlt === (file.alt ?? "").trim()) return
    setSaving(true)
    try {
      const updated = await updateMediaAlt(file.id, nextAlt)
      onSaved?.(updated)
      toast.success("Alt по умолчанию сохранён")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Не удалось сохранить Alt по умолчанию")
    } finally {
      setSaving(false)
    }
  }

  async function saveAuthor() {
    const nextAuthor = authorValue.trim()
    if (nextAuthor === (file.author ?? "").trim()) return
    setSaving(true)
    try {
      const updated = await updateMediaAuthor(file.id, nextAuthor)
      onSaved?.(updated)
      toast.success("Автор изображения сохранён")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Не удалось сохранить автора")
    } finally {
      setSaving(false)
    }
  }

  function blurOnEnter(event: React.KeyboardEvent<HTMLInputElement>) {
    event.stopPropagation()
    if (event.key === "Enter" && !isImeComposing(event)) {
      event.preventDefault()
      ;(event.currentTarget as HTMLInputElement).blur()
    }
  }

  return (
    <div className="space-y-1.5 border-t border-admin-border px-2 py-1.5" onClick={(event) => event.stopPropagation()}>
      <div>
        <label className="mb-0.5 block text-[10px] font-medium text-admin-fg-muted">Alt по умолчанию</label>
        <Input
          value={value}
          disabled={saving}
          onChange={(event) => setValue(event.target.value)}
          onBlur={() => void save()}
          onKeyDown={blurOnEnter}
          onClick={(event) => event.stopPropagation()}
          placeholder="Описание изображения"
          className="h-7 px-2 text-xs"
          aria-label={`Alt по умолчанию для ${file.name}`}
        />
      </div>
      <div>
        <label className="mb-0.5 block text-[10px] font-medium text-admin-fg-muted">Автор / источник</label>
        <Input
          value={authorValue}
          disabled={saving}
          onChange={(event) => setAuthorValue(event.target.value)}
          onBlur={() => void saveAuthor()}
          onKeyDown={blurOnEnter}
          onClick={(event) => event.stopPropagation()}
          placeholder="Например: Иван Иванов / Unsplash"
          className="h-7 px-2 text-xs"
          aria-label={`Автор изображения для ${file.name}`}
        />
      </div>
    </div>
  )
}
