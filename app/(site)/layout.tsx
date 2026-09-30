import { SiteHeader } from "@/components/site/site-header"
import { SiteFooter } from "@/components/site/site-footer"
import { CallbackProvider } from "@/components/site/callback-modal"
import { getBlocks, getPublicSettings } from "@/lib/cms"
import { getOfficeHoursLabel, getPrimaryEmail, getPrimaryPhone } from "@/lib/contact-settings"
import { socialsForHeader } from "@/lib/social-links"
import { analyticsConfigFromSettings } from "@/lib/analytics"
import { isCaptchaStatusVisible } from "@/lib/recaptcha-public"
import { buildTravelAgencyJsonLd, serializeJsonLd } from "@/lib/site-schema"
import { getBustourDeployEnv } from "@/lib/deploy-env"
import { AnalyticsWhenConsented } from "@/components/analytics-when-consented"
import { AnnouncementPopupLazy } from "@/components/site/announcement-popup-lazy"
import { getActiveAnnouncement } from "@/lib/announcement"

export const dynamic = "force-dynamic"

/**
 * Клиентским компонентам (header, провайдер звонка, аналитика) передаются
 * только вычисленные здесь значения. Полный объект `settings` содержит все
 * тексты CMS (политика, статьи, SEO всех страниц) и, попав в props клиентского
 * компонента, целиком сериализуется в HTML каждой страницы (~0,5 МБ).
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, directions] = await Promise.all([
    getPublicSettings(),
    getBlocks("direction", { onlyVisible: true }),
  ])
  const announcement = getActiveAnnouncement(settings)
  const primaryPhone = getPrimaryPhone(settings)
  const orgSchema = buildTravelAgencyJsonLd(settings, {
    phone: primaryPhone?.href.replace(/^tel:/, "") || settings["site.phone"],
    email: getPrimaryEmail(settings) || undefined,
  })
  const captchaStatusVisible = getBustourDeployEnv() === "dev" && isCaptchaStatusVisible(settings)
  const officeHours = getOfficeHoursLabel(settings)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(orgSchema) }}
      />
      <CallbackProvider phone={primaryPhone} hours={officeHours} captchaStatusVisible={captchaStatusVisible}>
        <div className="flex min-h-screen flex-col">
          <SiteHeader
            phone={primaryPhone}
            hours={settings["site.hours"] ?? ""}
            hoursNote={settings["site.hoursNote"] ?? ""}
            socials={socialsForHeader(settings)}
          />
          <div className="flex-1">{children}</div>
          <SiteFooter settings={settings} directions={directions} />
        </div>
      </CallbackProvider>
      {announcement ? (
        <AnnouncementPopupLazy title={announcement.title} text={announcement.text} type={announcement.type} />
      ) : null}
      <AnalyticsWhenConsented config={analyticsConfigFromSettings(settings)} />
    </>
  )
}
