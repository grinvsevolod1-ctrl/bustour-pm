import type { ReactNode } from "react"
import type { SettingsGroup } from "@/lib/admin-config"
import type { EditorWorkspaceGroup } from "@/components/admin/editor-workspace"
import { SEO_META_HEADING, deriveSeoSourceKeys } from "@/lib/seo-auto"
import { getCanonicalOrigin } from "@/lib/canonical-origin"
import { SeoPanel } from "@/components/admin/seo-panel"

export type SeoWorkspace = {
  /** Группа для workspaceGroups (вставлять перед «Порядок секций»). */
  seoGroup: EditorWorkspaceGroup
  /** Панель для workspaceExtraPanels (та же позиция, что и группа). */
  seoPanel: ReactNode
  /** Группы конфига без «SEO и мета» — для рендера в «Основном». */
  groupsWithoutSeo: SettingsGroup[]
}

/**
 * Единый вайринг вкладки «SEO» для редакторов страниц: находит группу
 * «SEO и мета» в конфиге, выводит ключи-источники авто-SEO эвристикой
 * (deriveSeoSourceKeys) и собирает пару группа+панель для EditorWorkspace.
 * Если группы нет — возвращает null (страница без SEO-настроек).
 */
export function buildSeoWorkspace({
  groups,
  settings,
  pagePath,
  fallbackTitle,
}: {
  groups: SettingsGroup[]
  settings: Record<string, string>
  /** Путь публичной страницы для SERP-превью, например "/hot/". */
  pagePath: string
  /** Fallback заголовка превью, когда контент-источник пуст. */
  fallbackTitle?: string
}): SeoWorkspace | null {
  const seoMetaGroup = groups.find((group) => group.heading === SEO_META_HEADING)
  if (!seoMetaGroup) return null

  const groupsWithoutSeo = groups.filter((group) => group !== seoMetaGroup)
  const { titleKey, descriptionKey } = deriveSeoSourceKeys(groups)
  const serpHost = new URL(getCanonicalOrigin()).host

  const badge = seoMetaGroup.fields.some((field) => Boolean(settings[field.key]?.trim()))

  const seoGroup: EditorWorkspaceGroup = {
    id: "seo",
    label: "SEO",
    badge,
    anchorIds: ["s-seo", "s-seo-fields"],
  }

  const seoPanel = (
    <div id="s-seo" className="scroll-mt-4">
      <SeoPanel
        fields={seoMetaGroup.fields}
        settings={settings}
        serpHost={serpHost}
        serpPath={pagePath}
        sourceTitleKey={titleKey}
        sourceDescriptionKey={descriptionKey}
        fallbackTitle={fallbackTitle}
      />
    </div>
  )

  return { seoGroup, seoPanel, groupsWithoutSeo }
}
