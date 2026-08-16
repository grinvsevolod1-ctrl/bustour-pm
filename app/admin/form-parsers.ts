// Общие парсеры JSON-полей форм админки. Используются tour-actions и actions
// (автобусы). НЕ "use server" — это обычные утилиты, не server actions.
import { coerceMediaNodeList, type MediaNode } from "@/lib/media/node"
import type { TourInput } from "@/lib/queries"
import type { IncludedGroup } from "@/lib/types"

export function parseJsonField<T>(value: FormDataEntryValue | null, fallback: T): T {
  try {
    const parsed = JSON.parse(String(value || ""))
    return (parsed ?? fallback) as T
  } catch {
    return fallback
  }
}

export function parseGallery(value: FormDataEntryValue | null): MediaNode[] {
  return coerceMediaNodeList(parseJsonField<unknown[]>(value, []))
}

export function parseDocuments(value: FormDataEntryValue | null): TourInput["documents"] {
  const raw = parseJsonField<Record<string, unknown>[]>(value, [])
  if (!Array.isArray(raw)) return []
  return raw
    .map((d) => ({
      title: String(d?.title ?? "").trim(),
      href: String(d?.href ?? "").trim(),
      size: String(d?.size ?? "").trim(),
    }))
    .filter((d) => d.title || d.href)
}

const layoutKeys = new Set(["dates", "callus", "program", "included", "gallery", "seo", "documents", "faq", "reviews"])

export function parseLayout(value: FormDataEntryValue | null): TourInput["layout"] {
  const raw = parseJsonField<Record<string, unknown>[]>(value, [])
  if (!Array.isArray(raw)) return []
  return raw
    .filter((s) => layoutKeys.has(String(s?.key)))
    .map((s) => ({
      key: String(s.key) as TourInput["layout"][number]["key"],
      label: String(s?.label ?? "").trim(),
      visible: !!s?.visible,
    }))
}

export function parseWhatIncluded(value: FormDataEntryValue | null): IncludedGroup[] {
  try {
    const parsed = JSON.parse(String(value || "[]")) as IncludedGroup[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((g) => ({
        title: String(g.title || "").trim(),
        marker: g.marker || "check",
        items: (Array.isArray(g.items) ? g.items : []).map((i) => String(i).trim()).filter(Boolean),
      }))
      .filter((g) => g.title || g.items.length)
  } catch {
    return []
  }
}
