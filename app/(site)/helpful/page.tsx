import type { Metadata } from "next"
import { Breadcrumb } from "@/components/site/breadcrumb"
import { TitleUnderline } from "@/components/site/title-underline"
import { PageExtras } from "@/components/site/page-extras"
import { ArticleCategorySection } from "@/components/site/article-category-section"
import { CmsText } from "@/components/site/cms-text"
import { getArticles } from "@/lib/queries"
import { getPublicSettings } from "@/lib/cms"
import { metadataFromSettings } from "@/lib/seo-metadata"
import { expandPublicList } from "@/lib/expand-content-blocks"
import { ARTICLE_CATEGORIES, type ArticleCategory } from "@/lib/types"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings()
  return metadataFromSettings(
    settings,
    "info",
    "Полезная информация — БасТур",
    "Статьи и советы для путешественников от туристической компании БасТур.",
    { path: "/helpful/" },
  )
}

export default async function InfoPage() {
  const [settings, rawArticles] = await Promise.all([getPublicSettings(), getArticles()])
  const articles = await expandPublicList(rawArticles)
  const grouped = new Map<ArticleCategory, typeof articles>()
  for (const category of ARTICLE_CATEGORIES) grouped.set(category, [])
  for (const article of articles) {
    const group = grouped.get(article.category)
    if (group) group.push(article)
  }

  const title = settings["info.title"]?.trim() || "Полезная информация"
  const intro = settings["info.intro"]?.trim() || ""

  return (
    <>
      <main className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-6">
        <Breadcrumb items={[{ label: "Главная", href: "/" }, { label: title }]} />
        <div className="space-y-8">
          <div className="space-y-3">
            <TitleUnderline as="h1">{title}</TitleUnderline>
            <CmsText text={intro} className="max-w-3xl text-muted-foreground leading-relaxed" />
          </div>
          {ARTICLE_CATEGORIES.map((category) => {
            const categoryArticles = grouped.get(category) ?? []
            return categoryArticles.length ? (
              <ArticleCategorySection
                key={category}
                category={category}
                articles={categoryArticles}
              />
            ) : null
          })}
        </div>
      </main>
      <PageExtras pageKey="info" />
    </>
  )
}
