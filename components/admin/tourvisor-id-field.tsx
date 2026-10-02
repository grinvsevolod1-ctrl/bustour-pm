"use client"

import { Input, Label } from "@/components/admin/ui"
import { TOURVISOR_ID_FIELD } from "@/lib/tourvisor-widget"

export type TourvisorIdOption = { id: number; name: string }

/**
 * Данные для поля «ID в Tourvisor», которые считает сервер (RSC) по снимку
 * справочника: подсказки для datalist и автоподбор по названию.
 */
export type TourvisorIdFieldData = {
  options: TourvisorIdOption[]
  auto: TourvisorIdOption | null
}

export function TourvisorIdField({
  id,
  form,
  kind,
  defaultValue,
  data,
}: {
  id: string
  form: string
  kind: "country" | "resort"
  defaultValue: number | null
  data: TourvisorIdFieldData
}) {
  const listId = `${id}-options`
  const label = kind === "country" ? "ID страны в Tourvisor" : "ID курорта в Tourvisor"
  const hint = data.auto
    ? `Пусто — подбирается по названию: ${data.auto.id} (${data.auto.name}).`
    : "По названию не найдено — укажите ID вручную, иначе виджет покажет направление по умолчанию."
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={TOURVISOR_ID_FIELD}
        form={form}
        list={listId}
        inputMode="numeric"
        pattern="\d*"
        maxLength={9}
        defaultValue={defaultValue ?? ""}
        placeholder={data.auto ? String(data.auto.id) : "например, 4"}
        autoComplete="off"
      />
      <datalist id={listId}>
        {data.options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </datalist>
      <p className="mt-1 text-xs text-admin-fg-muted">
        Поисковый виджет Tourvisor на этой странице откроется с этим направлением. {hint}
      </p>
    </div>
  )
}
