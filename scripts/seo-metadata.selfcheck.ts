import assert from "node:assert/strict"
import robots from "@/app/robots"
import {
  absoluteUrl,
  clampMetaDescription,
  clampMetaTitle,
  metadataFromSettings,
  sitemapCountryPaths,
} from "@/lib/seo-metadata"
import {
  isUsablePublicCmsText,
  resolvePublicCmsText,
} from "@/lib/cms-public-text"
import { previewCountryBasePath } from "@/lib/preview-url"
import { expandShortcodes, getShortcodesDict, parseShortcodes } from "@/lib/shortcodes"

async function main() {
  assert.equal(clampMetaTitle("a".repeat(80)).length, 60)
  assert.equal(clampMetaDescription("b".repeat(200)).length, 160)
  assert.ok(clampMetaTitle("Заголовок").length < 60)

  assert.equal(isUsablePublicCmsText("2"), false)
  assert.equal(isUsablePublicCmsText("a"), false)
  assert.equal(isUsablePublicCmsText("aviatory-home#s-seo-meta"), false)
  assert.equal(
    isUsablePublicCmsText("<p>aviatory-home#s-seo-meta<br>aviatory-home#s-seo-meta</p>"),
    false,
  )
  assert.equal(isUsablePublicCmsText("Авиатуры из Минска"), true)
  assert.equal(resolvePublicCmsText("2", "Авиатуры — БасТур"), "Авиатуры — БасТур")
  assert.equal(
    resolvePublicCmsText("aviatory-home#s-seo-meta", "Авиатуры"),
    "Авиатуры",
  )

  const junkMeta = await metadataFromSettings(
    {
      "aviatory.metaTitle": "2",
      "aviatory.metaDescription": "x",
    },
    "aviatory",
    "Авиатуры — БасТур",
    "Пляжный отдых и экскурсионные авиатуры от всех туроператоров. Бронирование из Минска.",
    { path: "/aviatury/" },
  )
  assert.equal(junkMeta.title, "Авиатуры — БасТур")
  assert.ok(String(junkMeta.description).length >= 12)
  assert.notEqual(junkMeta.title, "2")

  const junkBus = await metadataFromSettings(
    { "bustours.metaTitle": "a" },
    "bustours",
    "Автобусные туры — БасТур",
    "Комфортные автобусные путешествия из Минска.",
    { path: "/avtobusnye-tury/" },
  )
  assert.equal(junkBus.title, "Автобусные туры — БасТур")

  assert.equal(parseShortcodes("Горящие туры [Y]", { Y: "2026" }), "Горящие туры 2026")
  assert.ok(!/\[[A-Za-z0-9]+\]/.test(parseShortcodes("Горящие туры [Y]", { Y: "2026" })))
  assert.equal(await expandShortcodes("plain"), "plain")

  const dict = await getShortcodesDict()
  const token = Object.keys(dict)[0]
  if (token) {
    const value = dict[token]!
    const meta = await metadataFromSettings(
      {
        "hot.metaTitle": `Tours [${token}]`,
        "hot.metaDescription": `Desc [${token}]`,
      },
      "hot",
      "Fallback",
      "Fallback desc",
      { path: "/hot/" },
    )
    assert.equal(meta.title, clampMetaTitle(`Tours ${value}`))
    assert.equal(meta.description, clampMetaDescription(`Desc ${value}`))
    assert.ok(!/\[[A-Za-z0-9]+\]/.test(String(meta.title)))
    assert.ok(!/\[[A-Za-z0-9]+\]/.test(String(meta.description)))
    assert.equal((meta.openGraph as { title?: string }).title, meta.title)
    assert.equal(await expandShortcodes(`H1 [${token}]`), `H1 ${value}`)
  }

  const plainMeta = await metadataFromSettings(
    {
      "home.metaTitle": "Home title",
      "home.metaDescription": "Home desc",
      "home.metaImage": "/og.jpg",
    },
    "home",
    "Fallback",
    "Fallback desc",
    { path: "/", imageAlt: "Preview" },
  )

  assert.equal(plainMeta.title, "Home title")
  assert.equal(plainMeta.description, "Home desc")
  assert.deepEqual(plainMeta.alternates, { canonical: absoluteUrl("/") })
  assert.equal((plainMeta.openGraph as { title?: string } | undefined)?.title, "Home title")
  assert.equal((plainMeta.twitter as { card?: string } | undefined)?.card, "summary_large_image")
  assert.deepEqual((plainMeta.openGraph as { images?: { alt?: string }[] } | undefined)?.images, [
    { url: "/og.jpg", alt: "Preview" },
  ])

  // #44: поиск (<meta name="description">) берёт metaDescription, а превью-карточка
  // (OG/Twitter) — metaShortDesc. Раньше оба брали превью — это была ошибка.
  const splitDesc = await metadataFromSettings(
    {
      "tour:7.metaTitle": "Tour title",
      "tour:7.metaDescription": "Long description text",
      "tour:7.metaShortDesc": "Short preview text",
    },
    "tour:7",
    "Fallback",
    "Fallback desc",
  )
  assert.equal(splitDesc.description, "Long description text")
  assert.equal(
    (splitDesc.openGraph as { description?: string } | undefined)?.description,
    "Short preview text",
  )
  assert.equal(
    (splitDesc.twitter as { description?: string } | undefined)?.description,
    "Short preview text",
  )

  // Превью пустое → в OG-карточку уходит описание для поиска.
  const previewFallsBackToSearch = await metadataFromSettings(
    {
      "tour:8.metaTitle": "Tour 8",
      "tour:8.metaDescription": "Only search description",
    },
    "tour:8",
    "Fallback",
    "Fallback desc",
  )
  assert.equal(previewFallsBackToSearch.description, "Only search description")
  assert.equal(
    (previewFallsBackToSearch.openGraph as { description?: string } | undefined)?.description,
    "Only search description",
  )

  // Поиск пустой → в meta description уходит превью.
  const searchFallsBackToPreview = await metadataFromSettings(
    {
      "tour:9.metaTitle": "Tour 9",
      "tour:9.metaShortDesc": "Only preview text",
    },
    "tour:9",
    "Fallback",
    "Fallback desc",
  )
  assert.equal(searchFallsBackToPreview.description, "Only preview text")

  // #62: reviews page uses reviews.* keys + /reviews canonical
  const reviewsMeta = await metadataFromSettings(
    {
      "reviews.metaTitle": "Отзывы — БасТур",
      "reviews.metaShortDesc": "Превью отзывов",
      "reviews.metaDescription": "Длинное описание",
    },
    "reviews",
    "Fallback",
    "Fallback desc",
    { path: "/reviews" },
  )
  assert.equal(reviewsMeta.description, "Длинное описание")
  assert.equal(
    (reviewsMeta.openGraph as { description?: string } | undefined)?.description,
    "Превью отзывов",
  )
  assert.deepEqual(reviewsMeta.alternates, { canonical: absoluteUrl("/reviews") })

  const descFallback = await metadataFromSettings(
    {
      "company.metaTitle": "Company",
      "company.metaDescription": "Company description only",
    },
    "company",
    "Fallback",
    "Fallback desc",
  )
  assert.equal(descFallback.description, "Company description only")

  const { readFileSync } = await import("node:fs")
  const { join, dirname } = await import("node:path")
  const { fileURLToPath } = await import("node:url")
  const root = join(dirname(fileURLToPath(import.meta.url)), "..")
  const infoPage = readFileSync(join(root, "app/(site)/helpful/[slug]/page.tsx"), "utf8")
  // Поиск берёт metaDescription первым, превью-карточка — metaShortDesc первым.
  assert.match(
    infoPage,
    /rawSearchDescription\s*=\s*[\s\S]{0,80}metaDescription\s*\|\|\s*article\?\.metaShortDesc/,
    "article search description must prefer metaDescription",
  )
  assert.match(
    infoPage,
    /rawPreviewDescription\s*=\s*[\s\S]{0,80}metaShortDesc\s*\|\|\s*article\?\.metaDescription/,
    "article preview description must prefer metaShortDesc",
  )

  const paths = sitemapCountryPaths([
    { slug: "rossiya", category: "bus" },
    { slug: "egipet", category: "avia" },
    { slug: "turciya", category: "hot" },
  ])
  // Public avia prefix defaults to /aviatury/, never internal /aviatory/
// Единый формат: без завершающего слеша (сервер 308-редиректит `/x/` → `/x`).
assert.deepEqual(paths.sort(), ["/aviatury/egipet", "/avtobusnye-tury/rossiya", "/hot/turciya"].sort())
assert.ok(!paths.includes("/aviatory/egipet"))
assert.ok(!paths.includes("/aviatory/rossiya"))
assert.ok(paths.every((p) => !p.endsWith("/")), "sitemap country paths must not end with slash")
// absoluteUrl нормализует legacy-пути со слешем и не трогает корень.
assert.equal(absoluteUrl("/avtobusnye-tury/rossiya/"), absoluteUrl("/avtobusnye-tury/rossiya"))
assert.ok(!absoluteUrl("/helpful/").endsWith("/"))
assert.ok(absoluteUrl("/").endsWith("/"))
  assert.deepEqual(
    sitemapCountryPaths([{ slug: "egipet", category: "avia" }], "aviatory"),
    ["/aviatury/egipet/"],
  )
  assert.deepEqual(
    sitemapCountryPaths([{ slug: "egipet", category: "avia" }], "custom-avia"),
    ["/custom-avia/egipet/"],
  )

  assert.equal(previewCountryBasePath("avia", "egipet"), "/aviatury/egipet/")
  assert.equal(previewCountryBasePath("avia", "egipet", "aviatory"), "/aviatury/egipet/")
  assert.equal(previewCountryBasePath("avia", "egipet", "custom-avia"), "/custom-avia/egipet/")
  assert.equal(previewCountryBasePath("bus", "rossiya"), "/avtobusnye-tury/rossiya/")

  const robotsConfig = robots()
  assert.ok(robotsConfig.rules)
  console.log("seo-metadata.selfcheck: ok")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
