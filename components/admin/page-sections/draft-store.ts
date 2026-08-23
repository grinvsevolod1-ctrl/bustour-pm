"use client"

// Общий черновик (порядок + видимость секций) для PageSectionsManager.
// Вынесен из page-sections-manager.tsx, чтобы логика хранилища жила отдельно
// от рендера: content/order-виды синхронизируются через один store,
// запись в БД происходит только по «Сохранить» (см. persistDraftStore в менеджере).

import { useEffect, useSyncExternalStore } from "react"
import type { PageSection } from "@/lib/admin-config"

export function sectionSettingKey(prefix: string, key: string) {
  return prefix ? `${prefix}.section.${key}` : `section.${key}`
}

/** `home.section.faq` → `faq`; `section.faq` (глобальные ключи главной) → `faq` */
export function toShortSectionKey(fullOrShortKey: string) {
  const scoped = fullOrShortKey.indexOf(".section.")
  if (scoped >= 0) return fullOrShortKey.slice(scoped + ".section.".length)
  if (fullOrShortKey.startsWith("section.")) return fullOrShortKey.slice("section.".length)
  return fullOrShortKey
}

export type DraftSnap = {
  order: string[]
  visibility: Record<string, boolean>
  rev: number
}

export type DraftStore = {
  snap: DraftSnap
  listeners: Set<() => void>
  baseline: string
  baselineOrder: string
  fullBaseline: string
  persistLock: Promise<void> | null
}

const draftStores = new Map<string, DraftStore>()

/** Удаляем простаивающий store, чтобы долгие админ-сессии не копили все pageKey. */
export function releaseDraftStore(storeId: string): boolean {
  const store = draftStores.get(storeId)
  if (!store || store.listeners.size > 0) return false
  draftStores.delete(storeId)
  return true
}

/** @internal selfcheck */
export function draftStoresSizeForTest() {
  return draftStores.size
}

/** @internal selfcheck — заполнение без React */
export function getDraftStoreForTest(
  storeId: string,
  settingsPrefix = "",
  initialOrder: string[] = [],
  settings: Record<string, string> = {},
) {
  return getDraftStore(storeId, settingsPrefix, initialOrder, [], settings)
}

/** @internal selfcheck — мутация порядка/видимости без React */
export function patchDraftForTest(
  store: ReturnType<typeof getDraftStoreForTest>,
  patch: Partial<Pick<DraftSnap, "order" | "visibility">>,
) {
  patchDraft(store, patch)
}

function buildVisibility(
  settingsPrefix: string,
  order: string[],
  sections: PageSection[],
  settings: Record<string, string>,
): Record<string, boolean> {
  const vis: Record<string, boolean> = {}
  for (const section of sections) {
    vis[section.key] = (settings[section.key] ?? "1") !== "0"
  }
  for (const shortKey of order) {
    const fullKey = sectionSettingKey(settingsPrefix, shortKey)
    const baseKey = sectionSettingKey(settingsPrefix, shortKey.replace(/\d+$/, ""))
    if (!(fullKey in vis)) {
      vis[fullKey] = (settings[fullKey] ?? settings[baseKey] ?? "1") !== "0"
    }
  }
  return vis
}

function draftBaseline(
  settingsPrefix: string,
  initialOrder: string[],
  sections: PageSection[],
  settings: Record<string, string>,
) {
  const orderPart = JSON.stringify(initialOrder)
  const sectionVis = sections.map((s) => `${s.key}:${settings[s.key] ?? "1"}`).join("|")
  const orderVis = initialOrder
    .map((k) => {
      const fullKey = sectionSettingKey(settingsPrefix, k)
      return `${fullKey}:${settings[fullKey] ?? "1"}`
    })
    .join("|")
  return `${orderPart}::${sectionVis}::${orderVis}`
}

function getDraftStore(
  storeId: string,
  settingsPrefix: string,
  initialOrder: string[],
  sections: PageSection[],
  settings: Record<string, string>,
): DraftStore {
  let store = draftStores.get(storeId)
  const baseline = draftBaseline(settingsPrefix, initialOrder, sections, settings)
  const initialVisibility = buildVisibility(settingsPrefix, initialOrder, sections, settings)
  const fullBaseline = JSON.stringify({ order: initialOrder, visibility: initialVisibility })
  if (!store) {
    store = {
      snap: {
        order: [...initialOrder],
        visibility: initialVisibility,
        rev: 0,
      },
      listeners: new Set(),
      baseline,
      baselineOrder: JSON.stringify(initialOrder),
      fullBaseline,
      persistLock: null,
    }
    draftStores.set(storeId, store)
    return store
  }
  return store
}

function emitDraft(store: DraftStore) {
  store.listeners.forEach((listener) => listener())
}

export function patchDraft(store: DraftStore, patch: Partial<Pick<DraftSnap, "order" | "visibility">>) {
  store.snap = {
    order: patch.order ?? store.snap.order,
    visibility: patch.visibility ?? store.snap.visibility,
    rev: store.snap.rev + 1,
  }
  emitDraft(store)
}

export function resolveVisible(
  visibility: Record<string, boolean>,
  fullKey: string,
  baseFullKey: string,
): boolean {
  return visibility[fullKey] ?? visibility[baseFullKey] ?? true
}

export function useSectionsDraft(
  pageKey: string,
  settingsPrefix: string,
  initialOrder: string[],
  sections: PageSection[],
  settings: Record<string, string>,
) {
  const storeId = `${pageKey}::${settingsPrefix}`
  const store = getDraftStore(storeId, settingsPrefix, initialOrder, sections, settings)
  const baseline = draftBaseline(settingsPrefix, initialOrder, sections, settings)

  useEffect(() => {
    if (store.baseline === baseline) return
    const newVisibility = buildVisibility(settingsPrefix, initialOrder, sections, settings)
    store.snap = {
      order: [...initialOrder],
      visibility: newVisibility,
      rev: store.snap.rev + 1,
    }
    store.baseline = baseline
    store.baselineOrder = JSON.stringify(initialOrder)
    store.fullBaseline = JSON.stringify({ order: initialOrder, visibility: newVisibility })
    emitDraft(store)
  }, [baseline, initialOrder, sections, settings, settingsPrefix, store])

  const snap = useSyncExternalStore(
    (onChange) => {
      store.listeners.add(onChange)
      return () => {
        store.listeners.delete(onChange)
        // microtask: Strict Mode при ремоунте успевает переподписаться до очистки
        queueMicrotask(() => releaseDraftStore(storeId))
      }
    },
    () => store.snap,
    () => store.snap,
  )

  return { storeId, store, order: snap.order, visibility: snap.visibility }
}
