import type { Metadata } from "next"
import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { Breadcrumb } from "@/components/site/breadcrumb"
import { TitleUnderline } from "@/components/site/title-underline"
import { PageExtras } from "@/components/site/page-extras"
import { getPublicSettings, isOn } from "@/lib/cms"
import { getTransfers } from "@/lib/queries"
import { metadataFromSettings } from "@/lib/seo-metadata"
import { ParsedText } from "@/components/site/parsed-text"
import { RichContent } from "@/components/site/rich-content"
import { CmsText } from "@/components/site/cms-text"
import { isCallusSectionKey } from "@/lib/multipliable-sections"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings()
  return metadataFromSettings(settings, "transfers", "Трансферы в аэропорт — БасТур", "Комфортный и надёжный трансфер в аэропорты Москвы из Минска. Шереметьево, Внуково, Домодедово и другие направления.", {
    path: "/helpful/transfery-v-aeroport",
  })
}

function DestCard({
  title,
  image,
  href,
}: {
  title: string
  image: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="group relative flex h-[280px] flex-col justify-between overflow-hidden rounded p-6 no-underline"
    >
      {/* Background image */}
      <Image
        src={image}
        alt={title}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      {/* Gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(0deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.12) 100%)",
        }}
        aria-hidden
      />
      {/* Title top */}
      <h3 className="relative z-10 m-0 text-2xl font-semibold text-white text-balance">
        {title}
      </h3>
      {/* Button bottom */}
      <span className="relative z-10 self-start rounded bg-brand px-6 py-3 text-base font-semibold text-brand-foreground transition-opacity group-hover:opacity-90">
        Подробнее
      </span>
    </Link>
  )
}

function TextBlock({ text }: { text: string }) {
  // CmsText сам различает HTML из rich-редактора и legacy plain text.
  return (
    <section className="text-base leading-relaxed text-ink">
      <CmsText text={text} className="space-y-4" />
    </section>
  )
}

export default async function TransfersPage() {
  const [settings, transfers] = await Promise.all([getPublicSettings(), getTransfers()])
  const visibleTransfers = transfers.filter((transfer) => settings[`transfer:${transfer.slug}.visible`] !== "0")
  const airportTransfers = visibleTransfers.filter((transfer) => transfer.category === "airport")
  const individualTransfers = visibleTransfers.filter((transfer) => transfer.category === "individual")

  const pageKey = "transfers"
  // Порядок секций из админки; сохранённые до появления контентных секций
  // порядки дополняем недостающими блоками в естественном месте (в начале).
  const sectionOrder = (() => {
    const fallback = ["intro", "airports", "individual", "outro", "faq", "callus"]
    try {
      const raw = settings[`${pageKey}.sections.order`]
      if (raw) {
        const parsed = JSON.parse(raw) as string[]
        const missing = ["intro", "airports", "individual", "outro"].filter((k) => !parsed.includes(k))
        return [...missing, ...parsed]
      }
    } catch {}
    return fallback
  })()

  const sectionVisible = (key: string) => isOn(settings, `${pageKey}.section.${key}`)

  // Единый поток секций: текстовые блоки и faq/callus чередуются в порядке из админки.
  type FlowItem =
    | { type: "block"; key: string; node: ReactNode }
    | { type: "extras"; keys: string[]; hasFaq: boolean }
  const flow: FlowItem[] = []
  let faqTaken = false
  const pushExtras = (key: string, isFaq: boolean) => {
    const last = flow[flow.length - 1]
    if (last?.type === "extras") {
      last.keys.push(key)
      if (isFaq) last.hasFaq = true
    } else {
      flow.push({ type: "extras", keys: [key], hasFaq: isFaq })
    }
  }
  for (const key of sectionOrder) {
    if (!sectionVisible(key)) continue
    if (key === "intro") {
      flow.push({
        type: "block",
        key,
        node: (
          <TextBlock
            text={
              settings["transfers.intro"] ||
              "Если вы хотя бы раз в жизни летали на самолете из другого города, а то и страны, то вы, наверняка, столкнулись с проблемой трансфера в аэропорт и обратно."
            }
          />
        ),
      })
    } else if (key === "airports" && airportTransfers.length) {
      flow.push({
        type: "block",
        key,
        node: (
          <section className="space-y-5">
            <TitleUnderline as="h2">
              <ParsedText
                text={settings["transfers.airportsTitle"] || "Трансфер в аэропорты Москвы из Минска"}
              />
            </TitleUnderline>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {airportTransfers.map((transfer) => (
                <DestCard
                  key={transfer.id}
                  title={transfer.title}
                  image={transfer.image || "/images/transfers/sheremetyevo.png"}
                  href={`/helpful/transfery-v-aeroport/${transfer.slug}`}
                />
              ))}
            </div>
          </section>
        ),
      })
    } else if (key === "individual" && individualTransfers.length) {
      flow.push({
        type: "block",
        key,
        node: (
          <section className="space-y-5">
            <TitleUnderline as="h2">
              <ParsedText
                text={
                  settings["transfers.individualTitle"] ||
                  "Индивидуальный трансфер в аэропорты Беларуси, России, Украины"
                }
              />
            </TitleUnderline>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {individualTransfers.map((transfer) => (
                <DestCard
                  key={transfer.id}
                  title={transfer.title}
                  image={transfer.image || "/images/transfers/individual.png"}
                  href={`/helpful/transfery-v-aeroport/${transfer.slug}`}
                />
              ))}
            </div>
          </section>
        ),
      })
    } else if (key === "outro") {
      flow.push({
        type: "block",
        key,
        node: (
          <TextBlock
            text={
              settings["transfers.outro"] ||
              "Мы предлагаем удобный и надежный трансфер в аэропорт.\nОт назначенного места вас забирает комфортабельный автобус."
            }
          />
        ),
      })
    } else if (/^seo\d*$/.test(key)) {
      const suffix = key === "seo" ? "" : key.replace("seo", "")
      const html = settings[`${pageKey}.seoHtml${suffix}`] ?? ""
      if (!html) continue
      const title = settings[`${pageKey}.seoTitle${suffix}`] ?? ""
      flow.push({
        type: "block",
        key,
        node: (
          <section className="space-y-4 text-base leading-relaxed text-ink">
            {title ? <TitleUnderline as="h2">{title}</TitleUnderline> : null}
            <RichContent html={html} />
          </section>
        ),
      })
    } else if ((key === "faq" || /^faq\d+$/.test(key)) && !faqTaken) {
      faqTaken = true
      pushExtras(key, true)
    } else if (isCallusSectionKey(key)) {
      pushExtras(key, false)
    }
  }

  return (
    <>
      <main className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-6">
        {/* Breadcrumbs */}
        <Breadcrumb
          items={[
            { label: "Главная", href: "/" },
            { label: "Полезная информация", href: "/helpful" },
            { label: "Трансферы в аэропорт" },
          ]}
        />

        <div className="space-y-10">
          <TitleUnderline as="h1">
            <ParsedText text={settings["transfers.title"] || "Трансферы в аэропорт"} />
          </TitleUnderline>

          {flow.map((item) =>
            item.type === "block" ? (
              <div key={item.key}>{item.node}</div>
            ) : (
              <PageExtras
                key={`extras-${item.keys.join("-")}`}
                pageKey={pageKey}
                faqScope={pageKey}
                sectionPrefix={pageKey}
                callusSlots={item.keys.filter(isCallusSectionKey)}
                showFaq={item.hasFaq}
                bare
              />
            ),
          )}
        </div>
      </main>
    </>
  )
}
