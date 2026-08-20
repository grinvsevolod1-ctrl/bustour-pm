import { Send } from "lucide-react"
import type { SocialIconId } from "@/lib/social-links"
import { SOCIAL_CIRCLE_BG } from "@/lib/social-links"

export type SocialIconSize = "sm" | "md"

/**
 * Единый источник иконок для шапки и футера. Все четыре бренда рендерятся
 * одинаково — самодостаточными 80×80 SVG (скруглённый квадрат + белый глиф),
 * чтобы Instagram и YouTube выглядели в том же стиле, что Viber и Telegram.
 * Раньше Instagram/YouTube были нарисованы контурными глифами и визуально
 * выбивались из общего ряда.
 */
const SOCIAL_ICON_SRC: Partial<Record<SocialIconId, string>> = {
  instagram: "/figma/instagram.svg",
  youtube: "/figma/youtube.svg",
  viber: "/figma/viber.svg",
  telegram: "/figma/telegram.svg",
}

/** Single shared glyph for BOTH header and footer (consistent rendering). */
export function SocialIconGlyph({
  icon,
  className,
}: {
  icon: SocialIconId
  className?: string
}) {
  const src = SOCIAL_ICON_SRC[icon]
  if (src) {
    return <img src={src} alt="" className={`h-full w-full shrink-0 object-contain ${className || ""}`} />
  }
  return <Send className={`h-full w-full shrink-0 object-contain ${className || ""}`} aria-hidden />
}

export function socialCircleIconSize(size: SocialIconSize) {
  if (size === "sm") {
    return { wrapper: "h-8 w-8 md:h-10 md:w-10", glyph: "h-full w-full" }
  }
  return { wrapper: "h-10 w-10", glyph: "h-full w-full" }
}

export function socialCircleWrapperClass(
  icon: SocialIconId,
  size: SocialIconSize = "md",
): string {
  const { wrapper } = socialCircleIconSize(size)
  return `grid ${wrapper} place-items-center rounded-full text-white transition-opacity hover:opacity-85 ${SOCIAL_CIRCLE_BG[icon]}`
}
