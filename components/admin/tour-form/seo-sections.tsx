"use client"

// SEO-секции формы тура (мета-поля + расширенный SEO-текст),
// вынесены из tour-form.tsx: полностью самостоятельная разметка без общего состояния.
import { ShortcodeInput } from "@/components/admin/shortcode-input"
import { SettingMediaField } from "@/components/admin/setting-media-field"
import { RichEditor } from "@/components/admin/rich-editor-lazy"
import { SeoLivePreview } from "@/components/admin/seo-panel"
import { getCanonicalOrigin } from "@/lib/canonical-origin"
import {
  SEO_META_DESCRIPTION_HINT,
  SEO_META_DESCRIPTION_LABEL,
  SEO_META_SHORT_DESC_HINT,
  SEO_META_SHORT_DESC_LABEL,
} from "@/lib/admin-config"
import { FormSection, Label } from "@/components/admin/ui"
import type { Tour } from "@/lib/types"

export function TourSeoSections({
  tour,
  tourMeta,
  showSeo,
}: {
  tour?: Tour
  tourMeta: Record<string, string>
  showSeo: boolean
}) {
  return (
    <>
      <FormSection id="s-seo-meta" title="SEO и мета">
        <div className="mb-4">
          <SeoLivePreview
            serpHost={new URL(getCanonicalOrigin()).host}
            serpPath={tour ? `/tour/${tour.slug}/` : "/tour/"}
            titleName="metaTitle"
            descriptionName="metaDescription"
            shortDescName="metaShortDesc"
            sourceTitleName="title"
            sourceDescriptionName="description"
            fallbackTitle={tour?.title}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="tour-meta-title">Title (SEO)</Label>
            <ShortcodeInput id="tour-meta-title" name="metaTitle" defaultValue={tourMeta.metaTitle} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="tour-meta-description">{SEO_META_DESCRIPTION_LABEL}</Label>
            <ShortcodeInput id="tour-meta-description" name="metaDescription" defaultValue={tourMeta.metaDescription} rows={3} multiline />
            <p className="mt-1 text-xs text-admin-fg-muted">{SEO_META_DESCRIPTION_HINT}</p>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="tour-meta-short">{SEO_META_SHORT_DESC_LABEL}</Label>
            <ShortcodeInput id="tour-meta-short" name="metaShortDesc" defaultValue={tourMeta.metaShortDesc} rows={2} multiline />
            <p className="mt-1 text-xs text-admin-fg-muted">{SEO_META_SHORT_DESC_HINT}</p>
          </div>
          <div className="sm:col-span-2">
            <SettingMediaField name="metaImage" label="Превью изображение" value={tourMeta.metaImage} />
          </div>
        </div>
      </FormSection>

      <div className={showSeo ? undefined : "hidden"} aria-hidden={!showSeo}>
        <FormSection id="s-seo" title="SEO-текст (расширенный)">
          <p className="mb-2 text-xs text-admin-fg-subtle">
            Форматирование, заголовки, списки, картинки, видео и ссылки. Показывается внизу страницы тура.
          </p>
          <div className="mb-4 max-w-3xl">
            <Label htmlFor="seoTitle" required={showSeo}>Заголовок блока</Label>
            <ShortcodeInput
              id="seoTitle"
              name="seoTitle"
              label="Заголовок блока"
              defaultValue={tour?.seoTitle}
              placeholder="Дополнительная информация"
              required={showSeo}
            />
            <p className="mt-1 text-xs text-admin-fg-subtle">Показывается как подчёркнутый заголовок SEO-блока.</p>
          </div>
          <RichEditor
            name="seoHtml"
            defaultValue={tour?.seoHtml}
            placeholder="SEO-текст страницы тура…"
            required={showSeo}
          />
        </FormSection>
      </div>
    </>
  )
}
