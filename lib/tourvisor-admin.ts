/**
 * Серверные подготовители данных для поля «ID в Tourvisor» в админке
 * (страна/курорт): подсказки datalist и автоподбор по названию.
 * Снимок справочника остаётся на сервере — клиенту уходит только нужный срез.
 */
import type { TourvisorIdFieldData } from "@/components/admin/tourvisor-id-field"
import {
  findTourvisorCountryId,
  findTourvisorResortId,
  listTourvisorResorts,
  resolveTourvisorCountryId,
  tourvisorCountries,
  tourvisorCountryName,
  tourvisorResortName,
} from "@/lib/tourvisor-directory"

export function countryTourvisorFieldData(country: { name: string }): TourvisorIdFieldData {
  const autoId = findTourvisorCountryId(country.name)
  return {
    options: tourvisorCountries.map(({ id, name }) => ({ id, name })),
    auto: autoId ? { id: autoId, name: tourvisorCountryName(autoId) ?? country.name } : null,
  }
}

export function cityTourvisorFieldData(
  city: { name: string },
  country: { name: string; tourvisorId?: number | null } | undefined,
): TourvisorIdFieldData {
  const countryTvId = country ? resolveTourvisorCountryId(country) : undefined
  const autoId = countryTvId ? findTourvisorResortId(countryTvId, city.name) : undefined
  return {
    options: (countryTvId ? listTourvisorResorts(countryTvId) : []).map(({ id, name }) => ({ id, name })),
    auto: autoId ? { id: autoId, name: tourvisorResortName(autoId) ?? city.name } : null,
  }
}
