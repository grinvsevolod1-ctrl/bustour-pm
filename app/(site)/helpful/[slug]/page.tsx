import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import { getArticle, getArticles } from "@/lib/queries"
import { articleUrl } from "@/lib/article-url"
import { getAltTextByUrl } from "@/lib/media/service"
import { expandShortcodes } from "@/lib/shortcodes"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)
  const rawTitle = article?.metaTitle || (article ? `${article.title} — БасТур` : "Статья — БасТур")
  // Поиск (<meta name="description">) — из metaDescription; превью-карточка
  // (OG) — из metaShortDesc. Каждое с взаимным запасным вариантом и excerpt.
  const rawSearchDescription =
    article?.metaDescription || article?.metaShortDesc || article?.excerpt || ""
  const rawPreviewDescription =
    article?.metaShortDesc || article?.metaDescription || article?.excerpt || ""
  const [title, description, previewDescription] = await Promise.all([
    expandShortcodes(rawTitle),
    expandShortcodes(rawSearchDescription),
    expandShortcodes(rawPreviewDescription),
  ])
  const image = article?.metaImage
  const imageAlt = image
    ? (await getAltTextByUrl(image)) || (await expandShortcodes(article?.title || title))
    : title

  return {
    title,
    description,
    ...(image
      ? {
          openGraph: {
            title: await expandShortcodes(article?.metaTitle || title),
            description: previewDescription,
            images: [{ url: image, alt: imageAlt }],
          },
        }
      : {}),
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) notFound()
  permanentRedirect(articleUrl(article))
}
