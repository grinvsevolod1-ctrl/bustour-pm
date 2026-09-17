"use client"

import { useMemo } from "react"
import type { AviaCountryEntry } from "@/lib/countries"
import { parseShortcodes } from "@/lib/parse-shortcodes"
import { DEFAULT_AVIA_SLUG } from "@/lib/avia-slug"
import { CatalogSidebar, type CatalogSidebarCountry } from "./catalog/catalog-sidebar"

type Props = {
  countries: AviaCountryEntry[]
  activeCountrySlug?: string
  activeCitySlug?: string
  /**
   * Публичный URL-префикс авиараздела, например "/aviatury".
   * ВАЖНО: дефолт — публичный слаг, а НЕ внутренняя папка "/aviatory".
   * Внутренний префикс в ссылках вызывает 301 в middleware, а RSC-префетчи
   * таких ссылок уходят в ERR_TOO_MANY_REDIRECTS. Страницы всегда должны
   * передавать резолвнутый префикс через resolveAviaSlug(settings["aviatory.slug"]).
   */
  aviaPrefix?: string
  onCountrySelect?: (countryName: string) => void
  /** Display-only shortcode expansion for labels (keys/onSelect stay raw). */
  shortcodesDict?: Record<string, string>
}

export function AviaSidebar({
  countries,
  activeCountrySlug,
  activeCitySlug,
  aviaPrefix = `/${DEFAULT_AVIA_SLUG}`,
  onCountrySelect,
  shortcodesDict = {},
}: Props) {
  const items = useMemo<CatalogSidebarCountry[]>(
    () =>
      countries.map((country) => {
        const cities = country.cities ?? []
        return {
          key: country.slug,
          label: parseShortcodes(country.name, shortcodesDict),
          href: `${aviaPrefix}/${country.slug}/`,
          isActive: country.slug === activeCountrySlug && !activeCitySlug,
          onSelect: onCountrySelect ? () => onCountrySelect(country.name) : undefined,
          cities: cities.map((city) => ({
            key: city.slug,
            label: parseShortcodes(city.name, shortcodesDict),
            href: `${aviaPrefix}/${country.slug}/${city.slug}/`,
            isActive: city.slug === activeCitySlug,
          })),
        }
      }),
    [countries, activeCountrySlug, activeCitySlug, aviaPrefix, onCountrySelect, shortcodesDict],
  )

  return <CatalogSidebar catalogKey="avia" countries={items} />
}
