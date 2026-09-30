/** Кешируемые варианты lib/cities для публичного сайта (см. lib/public/queries.ts). */
export * from "@/lib/cities"

import * as src from "@/lib/cities"
import { getPublicSettings } from "@/lib/cms"
import { cachedPublicQuery } from "@/lib/site-data-cache"
import type { CityCategory } from "@/lib/types"

export const getCityDestinations = cachedPublicQuery("city-destinations", src.getCityDestinations)
export const getCityDestination = cachedPublicQuery("city-destination", src.getCityDestination)

// settings в ключ кеша не кладём (см. lib/public/countries.ts): ключ — только категория.
const cachedCitiesByCountry = cachedPublicQuery("cities-by-country", async (category?: CityCategory) =>
  src.getCitiesByCountry(category, await getPublicSettings()),
)
export const getCitiesByCountry: typeof src.getCitiesByCountry = (category) => cachedCitiesByCountry(category)
