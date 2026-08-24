"use client"

// Форма тура: контейнер состояния и раскладки. Крупные самостоятельные блоки
// вынесены в components/admin/tour-form/: шапка (form-header), программа по
// дням (program-section) и SEO-секции (seo-sections).
import { useActionState, useEffect, useState } from "react"
import { ExternalLink, Plus } from "lucide-react"
import Link from "next/link"
import { useAdminDirtyForm } from "@/components/admin/use-admin-dirty-form"
import { useGuardedRouter } from "@/components/admin/use-guarded-router"
import { saveTourAction } from "@/app/admin/tour-actions"
import type { Tour, Country, CityDestination, Currency, TourSection, TourSectionKey } from "@/lib/types"
import { useActionToast } from "@/components/admin/use-action-toast"
import { SettingMediaField } from "@/components/admin/setting-media-field"
import { FaqEditor, type FaqGroupState } from "@/components/admin/faq-editor"
import { WhatIncludedBuilder } from "@/components/admin/what-included-builder"
import { GalleryBuilder } from "@/components/admin/gallery-builder"
import { TourCoverBuilder } from "@/components/admin/tour-cover-builder"
import { TourAdditionalBlock } from "@/components/admin/tour-additional-block"
import { FieldsGrid } from "@/components/admin/section-fields-form"
import { pageAlertFields } from "@/lib/admin-config"
import { DocumentsBuilder } from "@/components/admin/documents-builder"
import { TourLayoutBuilder } from "@/components/admin/tour-layout-builder"
import { AdminCombobox } from "@/components/admin/combobox"
import { SlugField } from "@/components/admin/slug-field"
import {
  FormSection,
  Button,
  Input,
  Select,
  Label,
  Alert,
} from "@/components/admin/ui"
import { EditorWorkspace, type EditorWorkspaceGroup } from "@/components/admin/editor-workspace"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { tourUrl } from "@/lib/tour-url"
import { resolveTourLayout } from "@/lib/tour-sections"
import { ShortcodeInput } from "@/components/admin/shortcode-input"
import { TourFormHeader } from "@/components/admin/tour-form/form-header"
import { TourProgramSection } from "@/components/admin/tour-form/program-section"
import { TourSeoSections } from "@/components/admin/tour-form/seo-sections"

type FaqItem = { question: string; answer: string }

export function TourForm({
  tour,
  countries = [],
  cities = [],
  currencies = [],
  tourTypes = [],
  faqs = [],
  faqGroups,
  arrivalCityName = "",
  tourVisible = true,
  tourMeta = {},
}: {
  tour?: Tour
  countries?: Country[]
  cities?: CityDestination[]
  currencies?: Currency[]
  tourTypes?: string[]
  faqs?: FaqItem[]
  faqGroups?: FaqGroupState[]
  arrivalCityName?: string
  tourVisible?: boolean
  tourMeta?: Record<string, string>
}) {
  const [state, action, pending] = useActionState(saveTourAction, null)
  const [saved, setSaved] = useState(false)
  const [datesConfirm, setDatesConfirm] = useState(false)
  const router = useGuardedRouter()
  const { markDirty, markClean, formInputHandlers } = useAdminDirtyForm({
    id: tour ? `tour-${tour.id}` : "tour-new",
    label: tour ? `Тур: ${tour.title || `#${tour.id}`}` : "Новый тур",
  })
  useEffect(() => {
    if (state?.success) markClean()
  }, [state?.success, markClean])
  const [layout, setLayout] = useState<TourSection[]>(() => resolveTourLayout(tour?.layout))
  const layoutKeys = new Set(layout.map((s) => s.key))
  const showSection = (key: TourSectionKey) => layoutKeys.has(key)

  // Combobox state for country and arrival city
  const [selectedCountryId, setSelectedCountryId] = useState<number | undefined>(tour?.countryId || undefined)
  const [selectedCityId, setSelectedCityId] = useState<number | undefined>(tour?.arrivalCityId || undefined)
  const [selectedCountry, setSelectedCountry] = useState(tour?.country ?? "")
  const [selectedCity, setSelectedCity] = useState(arrivalCityName ?? "")

  // Resolve selected country row by name (for FK-based filtering)
  const selectedCountryRow = countries.find((c) => c.id === selectedCountryId)

  // Filter cities to those matching the selected country by countryId (FK)
  const filteredCities = selectedCountryRow
    ? cities.filter((c) => c.countryId === selectedCountryRow.id)
    : []
  const countryHasNoCities = Boolean(selectedCountryRow && filteredCities.length === 0)

  const baseCurrency = currencies.find((c) => c.isBase) ?? currencies[0]
  const pageHref = tour
    ? tourUrl({
        tourSlug: tour.slug,
        countrySlug: tour.countrySlug,
        citySlug: tour.citySlug,
      }) ?? undefined
    : undefined

  useEffect(() => {
    if (state?.success) {
      setSaved(true)
      const timeout = setTimeout(() => setSaved(false), 3000)
      return () => clearTimeout(timeout)
    }
  }, [state])

  useActionToast(state, { successMessage: tour ? "Тур сохранён" : "Тур создан" })

  // ponytail: completeness is intentionally static from the initial tour payload; live field tracking is out of scope.
  const workspaceGroups: EditorWorkspaceGroup[] = [
    {
      id: "main",
      label: "Основное",
      badge: Boolean(tour && (tour.title || tour.description || tour.country || tour.citySlug || tour.alertText)),
      anchorIds: ["s-main", "s-alert"],
    },
    {
      id: "content",
      label: "Контент",
      badge: Boolean(
        tour &&
          (tour.gallery.length ||
            tour.whatIncluded.length ||
            tour.program.length ||
            tour.documents.length ||
            faqs.length),
      ),
      anchorIds: ["s-gallery", "s-included", "s-program", "s-docs", "s-faq"],
    },
    {
      id: "layout",
      label: "Порядок блоков",
      badge: Boolean(tour?.layout.length),
      anchorIds: ["s-layout"],
    },
    {
      id: "dates",
      label: "Даты и цены",
      badge: Boolean(tour?.datesTable.rows.length),
      anchorIds: ["s-dates"],
    },
    {
      id: "seo",
      label: "SEO",
      badge: Boolean(tour && (tour.seoTitle || tour.seoHtml)),
      anchorIds: ["s-seo-meta", "s-seo"],
    },
  ]

  return (
    <div>
      <TourFormHeader
        tour={tour}
        tourVisible={tourVisible}
        saved={saved}
        errorText={state?.error ? String(state.error) : undefined}
        pending={pending}
        pageHref={pageHref}
      />

      <form
        id="tour-form"
        action={action}
        className="space-y-4"
        // Почему: обязательные поля могут лежать внутри свёрнутого <details>
        // (например, цена в блоке «Дополнительно»). Браузер не может сфокусировать
        // скрытый контрол при нативной валидации — submit молча обрывается.
        // Раскрываем все details-предки невалидного поля до фокусировки.
        onInvalidCapture={(e) => {
          let details = (e.target as HTMLElement).closest("details")
          while (details) {
            details.open = true
            details = details.parentElement?.closest("details") ?? null
          }
        }}
        {...formInputHandlers()}
      >
      {tour ? <input type="hidden" name="id" value={tour.id} /> : null}

      {state?.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-admin-danger" role="alert">
          {state.error}
        </p>
      ) : null}

      <EditorWorkspace groups={workspaceGroups}>
      <>
      <FormSection id="s-main" title="Основное">
        <div className="max-w-3xl space-y-4">
          <p className="text-xs text-admin-fg-muted">* — обязательные поля</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="tour-title" required>Название</Label>
              <ShortcodeInput id="tour-title" name="title" label="Название" defaultValue={tour?.title} required />
            </div>
            <SlugField
              id="tour-slug"
              nameSourceId="tour-title"
              defaultValue={tour?.slug}
              autoFromName={!tour}
              placeholder="tur-v-kareliyu"
            />
          </div>
          <div>
            <Label htmlFor="description" required>Описание</Label>
            <ShortcodeInput
              id="description"
              name="description"
              label="Описа��ие"
              defaultValue={tour?.description}
              rows={3}
              multiline
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label required>Страна</Label>
              <AdminCombobox
                name="country"
                valueIdName="countryId"
                valueId={selectedCountryId}
                options={countries.map((c) => ({ id: c.id, name: c.name }))}
                value={selectedCountry}
                allowCreate={false}
                required
                onChange={(v, id) => {
                  setSelectedCountry(v)
                  setSelectedCountryId(id)
                  // Reset city if it no longer belongs to the new country (by countryId FK)
                  const nextCountryRow = countries.find((c) => c.id === id)
                  const stillValid = nextCountryRow
                    ? cities.some(
                        (c) =>
                          c.name.trim().toLowerCase() === selectedCity.trim().toLowerCase() &&
                          c.countryId === nextCountryRow.id,
                      )
                    : true
                  if (!stillValid) {
                    setSelectedCity("")
                    setSelectedCityId(undefined)
                  }
                }}
                placeholder="Выберите страну"
                hint="Выберите страну из списка (только автобусные)."
              />
            </div>
            <div>
              <Label required>Город прибытия</Label>
              <AdminCombobox
                name="arrivalCity"
                valueIdName="arrivalCityId"
                valueId={selectedCityId}
                options={filteredCities.map((c) => ({ id: c.id, name: c.name }))}
                value={selectedCity}
                onChange={(value, id) => {
                  setSelectedCity(value)
                  setSelectedCityId(id)
                }}
                allowCreate={false}
                required
                placeholder={countryHasNoCities ? "В выбранной стране нет городов" : "Выберите город"}
                hint={
                  selectedCountry.trim()
                    ? `Выберите город из списка страны «${selectedCountry}» (только автобусные).`
                    : "Сначала выберите страну для фильтрации городов."
                }
              />
              {countryHasNoCities && (
                <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-sm text-amber-800">
                    В стране «{selectedCountry}» пока нет городов.
                  </p>
                  <Link
                    href={`/admin/cities/new?category=bus&countryId=${selectedCountryRow?.id ?? ""}&country=${encodeURIComponent(selectedCountry)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-amber-900 hover:text-amber-950 hover:underline"
                  >
                    <Plus className="h-4 w-4" /> Создать город для «{selectedCountry}»
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="departure">Отправление</Label>
              <Input id="departure" name="departure" defaultValue={tour?.departure} placeholder="Минск" />
            </div>
            <div>
              <Label htmlFor="tourType">Тип тура</Label>
              <Select id="tourType" name="tourType" defaultValue={tour?.tourType || ""}>
                <option value="">— не указан —</option>
                {tour?.tourType && !tourTypes.includes(tour.tourType) ? (
                  <option value={tour.tourType}>{tour.tourType}</option>
                ) : null}
                {tourTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <TourCoverBuilder image={tour?.image} cover={tour?.cover} required />
          </div>
          <div id="s-alert">
            <FieldsGrid
              fields={pageAlertFields("")}
              settings={{
                alertText: tour?.alertText ?? "",
                alertType: tour?.alertType ?? "info",
              }}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-admin-fg">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={tour?.featured}
              className="h-4 w-4 rounded border-admin-border accent-admin-fg"
            />
            Показывать на главной (лучшие предложения)
          </label>
          <TourAdditionalBlock
            tourId={tour?.id}
            datesTable={tour?.datesTable}
            priceAmount={tour?.priceAmount}
            extraPriceAmount={tour?.extraPriceAmount}
            extraPriceCurrency={tour?.extraPriceCurrency}
            datesCurrency={tour?.datesCurrency || baseCurrency?.code}
            duration={tour?.duration}
            nights={tour?.nights}
            currencyCode={baseCurrency?.code}
            currencies={currencies}
          />
        </div>
      </FormSection>
      </>

      <>
      <fieldset disabled={!showSection("gallery")} className={showSection("gallery") ? undefined : "hidden"} aria-hidden={!showSection("gallery")}>
        <FormSection id="s-gallery" title="Галерея (слайдер)">
          <GalleryBuilder images={tour?.gallery} />
        </FormSection>
      </fieldset>
      <fieldset disabled={!showSection("included")} className={showSection("included") ? undefined : "hidden"} aria-hidden={!showSection("included")}>
        <FormSection id="s-included" title="Что входит в тур">
          <p className="mb-3 text-xs text-admin-fg-subtle">
            Гибкие колонки: свой заголовок, вид маркера и список пунктов для каждой.
          </p>
          <WhatIncludedBuilder groups={tour?.whatIncluded} />
        </FormSection>
      </fieldset>

      <fieldset disabled={!showSection("program")} className={showSection("program") ? undefined : "hidden"} aria-hidden={!showSection("program")}>
        <TourProgramSection initialProgram={tour?.program} markDirty={markDirty} />
      </fieldset>

      <fieldset disabled={!showSection("documents")} className={showSection("documents") ? undefined : "hidden"} aria-hidden={!showSection("documents")}>
        <FormSection id="s-docs" title="Полезные документы">
          <DocumentsBuilder documents={tour?.documents} />
        </FormSection>
      </fieldset>

      <fieldset disabled={!showSection("faq")} className={showSection("faq") ? undefined : "hidden"} aria-hidden={!showSection("faq")}>
        <FormSection id="s-faq" title="Частые вопросы (для этой страницы)">
          <FaqEditor items={faqs} groups={faqGroups} mode="groups" />
        </FormSection>
      </fieldset>

      </>

      <>
      <FormSection id="s-layout" title="Порядок блоков">
        <p className="mb-3 text-xs text-admin-fg-subtle">
          Скрыть (глаз), удалить или вернуть через «Добавить секцию» — как на страницах городов/стран.
        </p>
        <TourLayoutBuilder layout={layout} onChange={(l) => { setLayout(l); markDirty() }} />
      </FormSection>
      </>

      <>
      <fieldset disabled={!showSection("dates")} className={showSection("dates") ? undefined : "hidden"} aria-hidden={!showSection("dates")}>
        <FormSection id="s-dates" title="Даты и цены">
          {tour ? (
            <div className="space-y-4">
              <Alert tone="info">
                Даты и цены редактируются в отдельном рабочем пространстве с явным сохранением. Несохранённые изменения на этой странице не сохранятся автоматически — сохраните их перед переходом.
              </Alert>
              {/* ponytail: форма uncontrolled, а состояние билдеров делает дешёвый dirty-tracking ненадёжным; для редкого перехода всегда показываем подтверждение. */}
              <Button type="button" variant="secondary" onClick={() => setDatesConfirm(true)}>
                Редактировать даты и цены
              </Button>
              <ConfirmDialog
                open={datesConfirm}
                title="Перейти к датам и ценам?"
                message="Несохранённые изменения на этой странице могут быть потеряны. Перед переходом сохраните тур."
                confirmLabel="Перейти"
                onConfirm={() => router.push(`/admin/tour-pricing/${tour.id}`)}
                onCancel={() => setDatesConfirm(false)}
              />
            </div>
          ) : (
            <Alert tone="info">
              Шаг «Даты и цены» откроется после сохранения тура — гид по настройке сверху проведёт по остальным шагам.
            </Alert>
          )}
        </FormSection>
      </fieldset>
      </>

      <>
      <TourSeoSections tour={tour} tourMeta={tourMeta} showSeo={showSection("seo")} />
      </>

      </EditorWorkspace>
    </form>
    </div>
  )
}
