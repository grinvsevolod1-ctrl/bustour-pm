/**
 * Centralised URL builder for tour pages.
 *
 * Canonical: /avtobusnye-tury/{countrySlug}/{citySlug}/{tourSlug}
 * Returns null when any slug missing — never invents "unknown".
 *
 * Без завершающего слэша намеренно: у приложения trailingSlash=false, и
 * Next отвечает 308 на любой «/…/»-адрес. Раньше каждый серверный редирект
 * на тур (legacy /tour/:slug, неверные сегменты страны/города) делал два
 * прыжка; <Link> слэш срезал сам, поэтому ссылки на сайте не меняются.
 */
export function tourUrl(opts: {
  tourSlug: string
  countrySlug?: string | null
  citySlug?: string | null
}): string | null {
  const tourSlug = (opts.tourSlug || "").trim()
  const country = (opts.countrySlug || "").trim()
  const city = (opts.citySlug || "").trim()
  if (!tourSlug || !country || !city) return null
  return `/avtobusnye-tury/${country}/${city}/${tourSlug}`
}
