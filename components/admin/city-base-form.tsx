"use client"

import { useState } from "react"
import type { CityDestination } from "@/lib/types"
import type { ComboboxOption } from "@/components/admin/combobox"
import { AdminCombobox } from "@/components/admin/combobox"
import { Input, Label } from "@/components/admin/ui"
import { SlugField } from "@/components/admin/slug-field"
import { TourvisorIdField, type TourvisorIdFieldData } from "@/components/admin/tourvisor-id-field"

const CATEGORY_LABELS = { bus: "Автобусные туры", avia: "Авиатуры", hot: "Горящие туры" } as const
const FORM_ID = "page-settings-form"

export function CityBaseForm({
  city,
  countries,
  tourvisor,
}: {
  city: CityDestination
  countries: ComboboxOption[]
  /** Только для авиа/горящих — у автобусных направлений виджета Tourvisor нет. */
  tourvisor?: TourvisorIdFieldData
}) {
  const [countryValue, setCountryValue] = useState(city.country ?? "")
  return (
    <div id="city-base-form" className="space-y-4">
      <input type="hidden" name="id" value={city.id} form={FORM_ID} />
      <input type="hidden" name="category" value={city.category} form={FORM_ID} />
      <input type="hidden" name="countryId" value={city.countryId ?? 0} form={FORM_ID} />
      <p className="text-xs text-admin-fg-muted">* — обязательные поля</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="city-name" required>Название города</Label>
          <Input id="city-name" name="name" form={FORM_ID} defaultValue={city.name} required placeholder="Анталья" />
        </div>
        <SlugField id="city-slug" nameSourceId="city-name" form={FORM_ID} defaultValue={city.slug} placeholder="antalya" />
        <div>
          <Label htmlFor="city-category">Раздел (тип туров)</Label>
          <Input id="city-category" value={CATEGORY_LABELS[city.category]} disabled />
          <p className="mt-1 text-xs text-admin-fg-muted">Раздел нельзя изменить после создания страницы.</p>
        </div>
        <div>
          <Label htmlFor="city-country" required>Страна</Label>
          <AdminCombobox name="country" form={FORM_ID} options={countries} value={countryValue} onChange={setCountryValue} placeholder="Выберите страну…" hint="Город появится в сайдбаре внутри этой страны." required />
        </div>
        {tourvisor ? (
          <TourvisorIdField
            id="city-tourvisor-id"
            form={FORM_ID}
            kind="resort"
            defaultValue={city.tourvisorId}
            data={tourvisor}
          />
        ) : null}
      </div>
    </div>
  )
}
