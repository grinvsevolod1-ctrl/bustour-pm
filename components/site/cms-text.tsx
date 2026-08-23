import { cn } from "@/lib/utils"
import { RichContent } from "@/components/site/rich-content"
import { ParsedText } from "@/components/site/parsed-text"

/**
 * Значение из CMS может быть в двух форматах:
 * - HTML из rich-редактора (TipTap) — новые сохранения;
 * - legacy plain text с переводами строк — старые сохранения и сиды.
 * Определяем формат по наличию тегов, как в components/site/faq.tsx.
 */
export function looksLikeHtml(s: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(s)
}

/**
 * Универсальный рендер CMS-текста: HTML — через RichContent (санитизация +
 * шорткоды), plain text — абзацами по переводу строки (шорткоды через
 * ParsedText). Нужен для обратной совместимости полей, переведённых
 * с textarea на rich-редактор (intro/outro посадочных и инфо-страниц).
 */
export async function CmsText({
  text,
  className,
  paragraphClassName,
}: {
  text?: string | null
  className?: string
  paragraphClassName?: string
}) {
  const value = (text ?? "").trim()
  if (!value) return null

  if (looksLikeHtml(value)) {
    return <RichContent html={value} className={className} />
  }

  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
  if (!lines.length) return null

  return (
    <div className={cn("space-y-2", className)}>
      {lines.map((line, index) => (
        <p key={index} className={paragraphClassName}>
          <ParsedText text={line} />
        </p>
      ))}
    </div>
  )
}
