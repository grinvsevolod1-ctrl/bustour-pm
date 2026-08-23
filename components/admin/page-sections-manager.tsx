"use client"

// PageSectionsManager — владеет порядком секций, рендерит сайдбар и карточки.
// Логика черновика (store), мокапы, навигация, карточка и пикер вынесены
// в components/admin/page-sections/* — здесь только оркестрация.

import { useContext, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Eye, EyeOff, Trash2,
  ChevronUp, ChevronDown, GripVertical, Pencil,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { saveSettingsAction } from "@/app/admin/cms-actions"
import { savePageSectionsOrderAction } from "@/app/admin/cms-actions"
import { PageSettingsFormContext } from "@/components/admin/page-settings-form"
import type { PageSection } from "@/lib/admin-config"
import { isMultipliableSectionBase, sectionBaseKey } from "@/lib/multipliable-sections"
import {
  type DraftStore,
  sectionSettingKey,
  toShortSectionKey,
  patchDraft,
  resolveVisible,
  useSectionsDraft,
} from "@/components/admin/page-sections/draft-store"
import { SectionsNav } from "@/components/admin/page-sections/sections-nav"
import { PageSectionCardWrapper } from "@/components/admin/page-sections/section-card"
import { AddSectionPicker } from "@/components/admin/page-sections/add-section-picker"

// Реэкспорт для selfcheck-скриптов (они импортируют из этого модуля)
export {
  releaseDraftStore,
  draftStoresSizeForTest,
  getDraftStoreForTest,
  patchDraftForTest,
} from "@/components/admin/page-sections/draft-store"

/** Запись черновика в БД: порядок + видимость; лочится, чтобы параллельные
    сохранения не перегоняли друг друга (rev-цикл добирает новые правки). */
async function persistDraftStore(
  store: DraftStore,
  pageKey: string,
  router: { refresh: () => void },
) {
  if (store.persistLock) return store.persistLock
  store.persistLock = (async () => {
    while (true) {
      const { order, visibility, rev } = store.snap
      const orderFd = new FormData()
      orderFd.set("__pageKey", pageKey)
      orderFd.set("order", JSON.stringify(order))
      await savePageSectionsOrderAction(orderFd)
      const visFd = new FormData()
      for (const [key, on] of Object.entries(visibility)) visFd.set(key, on ? "1" : "0")
      if ([...visFd.keys()].length > 0) await saveSettingsAction(null, visFd)
      if (store.snap.rev === rev) break
    }
    store.baselineOrder = JSON.stringify(store.snap.order)
    router.refresh()
  })().finally(() => {
    store.persistLock = null
  })
  return store.persistLock
}

export function PageSectionsManager({
  pageKey,
  settingsPrefix = pageKey,
  sections,
  initialOrder,
  settings,
  toggleKeys: _toggleKeys,
  sectionSlots = {},
  hideSidebar = false,
  hiddenSectionKeys = [],
  view = "content",
  sectionTitles,
}: {
  /** например "egipet" — используется как префикс ключей настроек */
  pageKey: string
  /** Необязательный префикс ключей настроек, когда ключи видимости старше page-scoped секций. */
  settingsPrefix?: string
  /** Полный список доступных секций из admin-config */
  sections: PageSection[]
  /** Начальный упорядоченный массив активных коротких ключей (например ["why","resorts",...]) */
  initialOrder: string[]
  settings: Record<string, string>
  toggleKeys: string
  /** Отрендеренный контент по коротким ключам (включая нумерованные варианты seo2, seo3 …) */
  sectionSlots?: Record<string, React.ReactNode>
  /** Только презентация: скрыть внутренний сайдбар, когда навигацией владеет внешний workspace. */
  hideSidebar?: boolean
  /** Только презентация: секции остаются в порядке/сохранении, но рендерятся в другом месте. */
  hiddenSectionKeys?: string[]
  /** Рендерить тела секций или только контролы порядка. */
  view?: "content" | "order"
  /** Необязательные заголовки для конкретного экземпляра — видны только в order-виде. */
  sectionTitles?: Record<string, string>
}) {
  void _toggleKeys
  const router = useRouter()
  const pageForm = useContext(PageSettingsFormContext)
  const { store, order, visibility } = useSectionsDraft(
    pageKey,
    settingsPrefix,
    initialOrder,
    sections,
    settings,
  )
  const [pickerOpen, setPickerOpen] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const hiddenKeys = new Set(hiddenSectionKeys)
  const orderDirty = JSON.stringify(order) !== store.baselineOrder
  void orderDirty
  const persistRef = useRef(() => persistDraftStore(store, pageKey, router))
  persistRef.current = () => persistDraftStore(store, pageKey, router)

  useEffect(() => {
    if (!pageForm) return
    return pageForm.registerDraft({
      id: `sections:${pageKey}`,
      label: "Порядок и видимость секций",
      tabHash: "#settings-order",
      isDirty: () => JSON.stringify({ order: store.snap.order, visibility: store.snap.visibility }) !== store.fullBaseline,
      append(fd) {
        fd.set("__pageKey", pageKey)
        fd.set("__sectionOrder", JSON.stringify(store.snap.order))
        fd.set("__sectionVisibility", JSON.stringify(store.snap.visibility))
      },
      commitBaseline() {
        store.fullBaseline = JSON.stringify({ order: store.snap.order, visibility: store.snap.visibility })
        store.baselineOrder = JSON.stringify(store.snap.order)
      },
      reset() {
        const { order, visibility } = JSON.parse(store.fullBaseline) as { order: string[]; visibility: Record<string, boolean> }
        patchDraft(store, { order, visibility })
      },
    })
  }, [pageForm, pageKey, store])

  function setOrder(next: string[]) {
    patchDraft(store, { order: next })
  }

  function setVisibility(fullKey: string, baseFullKey: string, next: boolean) {
    patchDraft(store, {
      visibility: {
        ...store.snap.visibility,
        [fullKey]: next,
        [baseFullKey]: next,
      },
    })
  }

  function moveUp(key: string) {
    const shortKey = toShortSectionKey(key)
    const idx = order.indexOf(shortKey)
    if (idx <= 0) return
    const next = [...order]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    setOrder(next)
  }

  function moveDown(key: string) {
    const shortKey = toShortSectionKey(key)
    const idx = order.indexOf(shortKey)
    if (idx < 0 || idx >= order.length - 1) return
    const next = [...order]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    setOrder(next)
  }

  function deleteSection(fullKey: string) {
    const shortKey = toShortSectionKey(fullKey)
    setOrder(order.filter((k) => k !== shortKey))
  }

  function addSection(fullKey: string) {
    const baseShortKey = toShortSectionKey(fullKey)
    let shortKey = baseShortKey
    if (order.includes(shortKey)) {
      let n = 2
      while (order.includes(`${baseShortKey}${n}`)) n++
      shortKey = `${baseShortKey}${n}`
    }
    const visKey = sectionSettingKey(settingsPrefix, shortKey)
    setOrder([...order, shortKey])
    setVisibility(visKey, fullKey, true)
    setPickerOpen(false)
  }

  function dropAt(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    const next = [...order]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(targetIndex, 0, moved)
    setOrder(next)
    setDragIndex(null)
    setDragOverIndex(null)
  }

  function toggleVisibility(fullKey: string, baseFullKey: string, current: boolean) {
    setVisibility(fullKey, baseFullKey, !current)
  }

  // Секции вне порядка — но allowMultiple-секции реестра всегда доступны в пикере
  const deletedSections = sections.filter((s) => {
    const shortKey = toShortSectionKey(s.key)
    if (isMultipliableSectionBase(shortKey)) return true // всегда показывать в пикере
    return !order.includes(shortKey)
  })

  const picker = (
    <AddSectionPicker
      deletedSections={deletedSections}
      open={pickerOpen}
      onToggle={() => setPickerOpen((v) => !v)}
      onClose={() => setPickerOpen(false)}
      onAdd={addSection}
    />
  )

  if (view === "order") {
    return (
      <div className="rounded-lg border border-admin-border bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs text-admin-fg-muted">Изменения порядка и видимости сохраняются по кнопке «Сохранить» в шапке страницы.</p>
        </div>
        <div className="space-y-1">
          {order.map((shortKey, index) => {
            const fullKey = sectionSettingKey(settingsPrefix, shortKey)
            const baseFullKey = sectionSettingKey(settingsPrefix, shortKey.replace(/\d+$/, ""))
            const sec = sections.find((s) => s.key === fullKey) ?? sections.find((s) => s.key === baseFullKey)
            if (!sec) return null
            const isVisible = resolveVisible(visibility, fullKey, baseFullKey)
            return (
              <div
                key={shortKey}
                draggable
                onDragStart={() => {
                  setDragIndex(index)
                  setDragOverIndex(index)
                }}
                onDragOver={(event) => {
                  event.preventDefault()
                  setDragOverIndex(index)
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  dropAt(index)
                }}
                onDragEnd={() => {
                  setDragIndex(null)
                  setDragOverIndex(null)
                }}
                className={cn(
                  "flex items-center gap-3 rounded-md border p-3 transition-colors",
                  dragOverIndex === index && dragIndex !== index
                    ? "border-admin-fg bg-admin-muted/60"
                    : "border-admin-border",
                )}
              >
                <span
                  className="cursor-grab text-admin-fg-subtle active:cursor-grabbing"
                  aria-label="Перетащить секцию"
                  title="Перетащить секцию"
                >
                  <GripVertical className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => moveUp(shortKey)}
                    disabled={index === 0}
                    title="Переместить вверх"
                    className="grid h-5 w-6 place-items-center rounded text-admin-fg-muted hover:bg-admin-muted hover:text-admin-fg disabled:opacity-30"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(shortKey)}
                    disabled={index === order.length - 1}
                    title="Переместить вниз"
                    className="grid h-5 w-6 place-items-center rounded text-admin-fg-muted hover:bg-admin-muted hover:text-admin-fg disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="min-w-0 flex-1">
                    {sectionTitles?.[shortKey] ? (
                      <>
                        <span className="block truncate text-sm font-medium text-admin-fg">
                          {sectionTitles[shortKey]}
                        </span>
                        <span className="block text-[11px] text-admin-fg-muted">{sec.label}</span>
                      </>
                    ) : (
                      <span className="text-sm font-medium text-admin-fg">{sec.label}</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    window.location.hash = `#sec-${shortKey}`
                  }}
                  title="Перейти к редактированию"
                  className="inline-flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs text-admin-fg-muted transition-colors hover:bg-admin-muted hover:text-admin-fg"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Перейти к редактированию
                </button>
                <button
                  type="button"
                  onClick={() => toggleVisibility(fullKey, baseFullKey, isVisible)}
                  title={isVisible ? "Скрыть секцию на сайте" : "Показать секцию на сайте"}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors",
                    isVisible
                      ? "text-admin-fg-muted hover:bg-amber-50 hover:text-amber-700"
                      : "text-green-700 hover:bg-green-50",
                  )}
                >
                  {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => deleteSection(fullKey)}
                  title="Удалить секцию со страницы"
                  className="rounded px-2 py-1 text-xs text-admin-fg-muted hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
        <div className="mt-4">{picker}</div>
      </div>
    )
  }

  return (
    <div className="flex gap-6">
      {/* Основная колонка контента */}
      <div className="min-w-0 flex-1 space-y-4">
        {order.map((shortKey) => {
          if (hiddenKeys.has(shortKey)) return null
          const fullKey = sectionSettingKey(settingsPrefix, shortKey)
          // Нумерованные ключи (например "seo2") откатываются к базовой конфигурации ("seo")
          const baseFullKey = sectionSettingKey(settingsPrefix, shortKey.replace(/\d+$/, ""))
          const sec = sections.find((s) => s.key === fullKey) ?? sections.find((s) => s.key === baseFullKey)
          if (!sec) return null
          const isVisible = resolveVisible(visibility, fullKey, baseFullKey)

          return (
            <PageSectionCardWrapper
              key={fullKey}
              sectionId={shortKey}
              label={sec.label}
              visible={isVisible}
              onToggle={() => toggleVisibility(fullKey, baseFullKey, isVisible)}
              onDelete={() => deleteSection(fullKey)}
            >
              {/* callus2+ переиспользуют общий слот (текст глобальный); seo/faq/resorts имеют свои */}
              {sectionSlots[shortKey] ??
                (sectionBaseKey(shortKey) === "callus" ? sectionSlots.callus : null) ??
                null}
            </PageSectionCardWrapper>
          )
        })}

        {/* Вернуть удалённые секции */}
        {picker}
      </div>

      {/* Липкий сайдбар — передаём короткие ключи, SectionsNav строит полные внутри */}
      {!hideSidebar && (
        <SectionsNav
          pageKey={pageKey}
          settingsPrefix={settingsPrefix}
          sections={sections}
          order={order.filter((k) =>
            !hiddenKeys.has(k) &&
            sections.some((s) =>
              s.key === sectionSettingKey(settingsPrefix, k) ||
              s.key === sectionSettingKey(settingsPrefix, k.replace(/\d+$/, "")),
            )
          )}
          visibleMap={visibility}
          onMoveUp={moveUp}
          onMoveDown={moveDown}
        />
      )}
    </div>
  )
}
