import type { Metadata } from "next"
import { getSettings } from "@/lib/cms"
import { legalPages, LEGAL_SLUGS, legalSettingKeys } from "@/lib/legal-pages"
import { PageSettingsForm } from "@/components/admin/page-settings-form"
import { SectionFieldsForm } from "@/components/admin/section-fields-form"
import { FormSection } from "@/components/admin/ui"
import type { EditorWorkspaceGroup } from "@/components/admin/editor-workspace"
import type { SettingField } from "@/lib/admin-config"
import { seoPreviewDescriptionFields } from "@/lib/admin-config"
import { SeoPanel } from "@/components/admin/seo-panel"
import { getCanonicalOrigin } from "@/lib/canonical-origin"

export const metadata: Metadata = { title: "Юридические документы — Админ-панель" }

/** SEO-поля документа — уходят во вкладку «SEO». */
function seoFieldsFor(prefix: string, titlePlaceholder: string): SettingField[] {
  const keys = legalSettingKeys(prefix)
  return [
    { key: keys.metaTitle, label: "Title (SEO)", type: "shortcode-input", placeholder: titlePlaceholder },
    ...seoPreviewDescriptionFields(prefix),
  ]
}

/** Контент-поля документа — остаются в его собственной вкладке. */
function contentFieldsFor(prefix: string): SettingField[] {
  const keys = legalSettingKeys(prefix)
  return [
    { key: keys.title, label: "Заголовок H1", type: "shortcode-input" },
    { key: keys.body, label: "Текст документа", type: "richtext" },
  ]
}

export default async function AdminLegalPages() {
  const settings = await getSettings()
  const serpHost = new URL(getCanonicalOrigin()).host
  const docs = LEGAL_SLUGS.map((slug) => {
    const page = legalPages[slug]
    const keys = legalSettingKeys(page.settingsPrefix)
    return {
      id: slug,
      heading: page.adminLabel,
      url: page.path,
      title: page.title,
      seoFields: seoFieldsFor(page.settingsPrefix, `${page.title} — БасТур`),
      contentFields: contentFieldsFor(page.settingsPrefix),
      titleKey: keys.title,
      bodyKey: keys.body,
    }
  })

  const seoBadge = docs.some((d) => d.seoFields.some((f) => Boolean(settings[f.key]?.trim())))
  const workspaceGroups: EditorWorkspaceGroup[] = [
    ...docs.map((d) => ({
      id: d.id,
      label: d.heading,
      badge: d.contentFields.some((f) => Boolean(settings[f.key]?.trim())),
      anchorIds: [`legal-${d.id}`],
    })),
    {
      id: "seo",
      label: "SEO",
      badge: seoBadge,
      anchorIds: docs.map((d) => `legal-seo-${d.id}`),
    },
  ]

  return (
    <PageSettingsForm
      title="Юридические документы"
      description="Тексты страниц из футера: оферта, конфиденциальность, видеонаблюдение, cookie."
      pageHref="/legal/privacy"
      workspaceGroups={workspaceGroups}
      workspaceBeforeForm={
        <div className="space-y-6">
          {docs.map((d) => (
            <FormSection key={d.id} id={`legal-${d.id}`} title={d.heading} collapsible={false}>
              <p className="mb-3 text-sm text-admin-fg-muted">
                Публичный URL:{" "}
                <a href={d.url} target="_blank" rel="noreferrer" className="underline hover:text-admin-fg">
                  {d.url}
                </a>
              </p>
              <SectionFieldsForm fields={d.contentFields} settings={settings} />
            </FormSection>
          ))}
        </div>
      }
      workspaceExtraPanels={docs.map((d) => (
        <div key={`legal-seo-${d.id}`} id={`legal-seo-${d.id}`} className="mt-6 scroll-mt-4 first:mt-0">
          <SeoPanel
            fields={d.seoFields}
            settings={settings}
            serpHost={serpHost}
            serpPath={d.url}
            sourceTitleKey={d.titleKey}
            sourceDescriptionKey={d.bodyKey}
            fallbackTitle={d.title}
            heading={`SEO — ${d.heading}`}
          />
        </div>
      ))}
    >
      {null}
    </PageSettingsForm>
  )
}
