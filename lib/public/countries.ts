/** Кешируемые варианты lib/countries для публичного сайта (см. lib/public/queries.ts). */
export * from "@/lib/countries"

import * as src from "@/lib/countries"
import { getPublicSettings } from "@/lib/cms"
import { cachedPublicQuery } from "@/lib/site-data-cache"

export const getCountries = cachedPublicQuery("countries", src.getCountries)
export const getCountry = cachedPublicQuery("country", src.getCountry)
export const getCountrySlugs = cachedPublicQuery("country-slugs", src.getCountrySlugs)

// settings (сотни КБ) в ключ кеша не кладём: страницы передают тот же объект,
// что возвращает getPublicSettings(), поэтому берём его внутри кешируемой функции.
const cachedAviaCountries = cachedPublicQuery("avia-countries", async () =>
  src.getAviaCountries(await getPublicSettings()),
)
export const getAviaCountries: typeof src.getAviaCountries = () => cachedAviaCountries()
