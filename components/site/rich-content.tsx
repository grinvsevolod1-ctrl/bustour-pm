import { cn } from "@/lib/utils"
import { getShortcodesDict, parseShortcodes } from "@/lib/shortcodes"
import { sanitizeCmsHtml } from "@/lib/sanitize-html"
import { collectImageSrcs, injectImageAuthorCredits } from "@/lib/image-credits"
import { getAuthorsByUrls } from "@/lib/media/service"

// Renders trusted admin-authored HTML (Tiptap output). Content is sanitized
// with an allowlist before rendering to prevent any accidental stored XSS
// even if the CMS input were ever compromised.
// Applies global shortcodes: `[Y]` → current year.
// После санитизации добавляет подпись «Фото: автор» под изображениями,
// у которых в медиагалерее заполнено поле «Автор/источник» (лицензии).
export async function RichContent({ html, className }: { html?: string | null; className?: string }) {
  if (!html || !html.trim()) return null
  const dict = await getShortcodesDict()
  const parsed = parseShortcodes(html, dict)
  let sanitized = sanitizeCmsHtml(parsed)
  const imageSrcs = collectImageSrcs(sanitized)
  if (imageSrcs.length) {
    const authors = await getAuthorsByUrls(imageSrcs)
    sanitized = injectImageAuthorCredits(sanitized, authors)
  }
  return <div className={cn("prose-content", className)} dangerouslySetInnerHTML={{ __html: sanitized }} />
}
