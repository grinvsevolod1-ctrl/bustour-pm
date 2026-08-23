import { notFound } from "next/navigation"
import { Breadcrumb } from "@/components/site/breadcrumb"
import { PageExtras } from "@/components/site/page-extras"
import { RichContent } from "@/components/site/rich-content"
import { TitleUnderline } from "@/components/site/title-underline"
import { formatArticleDate } from "@/lib/article-date"
import { articleUrl } from "@/lib/article-url"
import { getPublicSettings, getSiteOrigin, isOn } from "@/lib/cms"
import { isCallusSectionKey } from "@/lib/multipliable-sections"
import { getArticle, getArticleById } from "@/lib/queries"
import { previewAllows, readAuthorizedPreview } from "@/lib/preview-access"
import { ParsedText } from "@/components/site/parsed-text"
import { buildArticleJsonLd, serializeJsonLd } from "@/lib/site-schema"

export async function ArticlePageContent({
  slug,
  searchParams,
}: {
  slug: string
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const preview = await readAuthorizedPreview(searchParams)
  const article =
    preview?.type === "article" ? await getArticleById(preview.id) : await getArticle(slug)
  if (!article) notFound()
  if (article.archived) {
    if (!(await previewAllows(searchParams, "article", article.id))) notFound()
  }
  const settings = await getPublicSettings()
  const origin = getSiteOrigin(settings)
  const pageKey = `article:${article.id}`
  const sectionOrder = (() => {
    try {
      const raw = settings[`${pageKey}.sections.order`]
      if (raw) return JSON.parse(raw) as string[]
    } catch {}
    return ["seo", "faq", "callus"]
  })()
  const visibleSeoKeys = sectionOrder.filter((key) => {
    if (!/^seo\d*$/.test(key) || !isOn(settings, `${pageKey}.section.${key}`)) return false
    const suffix = key === "seo" ? "" : key.replace("seo", "")
    return Boolean(settings[`${pageKey}.seoHtml${suffix}`])
  })

  // Чередование секций по порядку из админки: seo-тексты и faq/callus идут
  // единым потоком (раньше все тексты рендерились подряд, а FAQ/«Перезвоните
  // нам» — всегда после них, из-за чего перестановка секций «не работала»).
  type FlowItem = { type: "seo"; key: string } | { type: "extras"; keys: string[]; hasFaq: boolean }
  const flow: FlowItem[] = []
  let faqTaken = false
  for (const key of sectionOrder) {
    if (/^seo\d*$/.test(key)) {
      if (visibleSeoKeys.includes(key)) flow.push({ type: "seo", key })
      continue
    }
    const isFaq = (key === "faq" || /^faq\d+$/.test(key)) && !faqTaken
    if (!isFaq && !isCallusSectionKey(key)) continue
    if (isFaq) faqTaken = true
    const last = flow[flow.length - 1]
    if (last?.type === "extras") {
      last.keys.push(key)
      if (isFaq) last.hasFaq = true
    } else {
      flow.push({ type: "extras", keys: [key], hasFaq: isFaq })
    }
  }

  const articleSchema = buildArticleJsonLd({
    origin,
    brandName: settings["site.brand"] || "БасТур",
    title: article.title,
    description: article.metaShortDesc || article.metaDescription || article.excerpt,
    image: article.metaImage || article.image,
    date: article.date,
    urlPath: articleUrl(article),
  })

  return (
    <>
      <main className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-6">
        {articleSchema ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleSchema) }}
          />
        ) : null}
        <Breadcrumb items={[{ label: "Полезная информация", href: "/helpful" }, { label: article.title }]} />
        <article className="mt-4">
          <span className="text-sm text-ink-muted">{formatArticleDate(article.date)}</span>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-ink text-balance">
            <ParsedText text={article.title} />
          </h1>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-ink">
            {visibleSeoKeys.length ? (
              flow.map((item) => {
                if (item.type === "seo") {
                  const suffix = item.key === "seo" ? "" : item.key.replace("seo", "")
                  const html = settings[`${pageKey}.seoHtml${suffix}`] ?? ""
                  const title = settings[`${pageKey}.seoTitle${suffix}`] ?? ""
                  return (
                    <section key={item.key} className="space-y-4">
                      {title ? <TitleUnderline as="h2">{title}</TitleUnderline> : null}
                      <RichContent html={html} />
                    </section>
                  )
                }
                return (
                  <PageExtras
                    key={`extras-${item.keys.join("-")}`}
                    pageKey={pageKey}
                    faqScope={pageKey}
                    sectionPrefix={pageKey}
                    callusSlots={item.keys.filter(isCallusSectionKey)}
                    showFaq={item.hasFaq}
                    bare
                  />
                )
              })
            ) : article.contentHtml ? (
              <RichContent html={article.contentHtml} />
            ) : (
              <p className="text-ink-muted">Материал скоро появится.</p>
            )}
          </div>
        </article>
      </main>
      {!visibleSeoKeys.length ? (
        <PageExtras
          pageKey={pageKey}
          faqScope={pageKey}
          sectionPrefix={pageKey}
          callusSlots={sectionOrder.filter(isCallusSectionKey)}
          showFaq={sectionOrder.some((k) => k === "faq" || /^faq\d+$/.test(k))}
        />
      ) : null}
    </>
  )
}
