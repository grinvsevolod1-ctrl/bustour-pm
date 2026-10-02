"use client"

import type { Country } from "@/lib/types"
import { Input, Label } from "@/components/admin/ui"
import { SlugField } from "@/components/admin/slug-field"
import { TourvisorIdField, type TourvisorIdFieldData } from "@/components/admin/tourvisor-id-field"

const CATEGORY_LABELS = { bus: "Автобусные туры", avia: "Авиатуры", hot: "Горящие туры" } as const
const FORM_ID = "page-settings-form"

export function CountryBaseForm({
  country,
  tourvisor,
}: {
  country: Country
  /** Только для авиа/горящих — у автобусных стран виджета Tourvisor нет. */
  tourvisor?: TourvisorIdFieldData
}) {
  return (
    <div id="country-base-form" className="space-y-4">
      <input type="hidden" name="id" value={country.id} form={FORM_ID} />
      <input type="hidden" name="category" value={country.category} form={FORM_ID} />
      <p className="text-xs text-admin-fg-muted">* — обязательные поля</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="country-name" required>Название страны</Label>
          <Input id="country-name" name="name" form={FORM_ID} defaultValue={country.name} required placeholder="Турция" />
        </div>
        <SlugField id="country-slug" nameSourceId="country-name" form={FORM_ID} defaultValue={country.slug} placeholder="turciya" />
        <div>
          <Label htmlFor="country-category">Категория</Label>
          <Input id="country-category" value={CATEGORY_LABELS[country.category]} disabled />
          <p className="mt-1 text-xs text-admin-fg-muted">Категорию нельзя изменить после создания страницы.</p>
        </div>
        {tourvisor ? (
          <TourvisorIdField
            id="country-tourvisor-id"
            form={FORM_ID}
            kind="country"
            defaultValue={country.tourvisorId}
            data={tourvisor}
          />
        ) : null}
      </div>
    </div>
  )
}
