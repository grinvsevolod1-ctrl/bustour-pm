// Подпись автора/источника под изображениями в CMS-контенте.
// Требование лицензий фотостоков: если у медиафайла заполнено поле
// «Автор/источник», выводим её на сайте под картинкой.

const IMG_TAG_RE = /<img\b[^>]*>/gi
const SRC_RE = /\bsrc\s*=\s*"([^"]*)"/i
const CLASS_RE = /\bclass\s*=\s*"([^"]*)"/i
const ALIGN_RE = /\bseo-align-(left|right|center|full)\b/

/** Собирает список src всех <img> в готовом HTML. */
export function collectImageSrcs(html: string): string[] {
  const srcs: string[] = []
  for (const match of html.matchAll(IMG_TAG_RE)) {
    const src = SRC_RE.exec(match[0])?.[1]
    if (src) srcs.push(src)
  }
  return srcs
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

/**
 * Вставляет подпись «Фото: автор» сразу после каждого <img>, для которого
 * известен автор. Вызывается ПОСЛЕ санитизации: добавляем только наш
 * экранированный <span>, ничего пользовательского в разметку не попадает.
 */
export function injectImageAuthorCredits(html: string, authorsByUrl: Map<string, string>): string {
  if (!authorsByUrl.size) return html
  return html.replace(IMG_TAG_RE, (imgTag) => {
    const src = SRC_RE.exec(imgTag)?.[1]
    const author = src ? authorsByUrl.get(src) : undefined
    if (!author) return imgTag
    // Подпись должна повторять выравнивание картинки: у обтекаемых (float)
    // изображений блочный span иначе «уплывает» в начало текстового потока.
    const align = ALIGN_RE.exec(CLASS_RE.exec(imgTag)?.[1] ?? "")?.[1]
    const creditClass = align ? `image-credit image-credit--${align}` : "image-credit"
    return `${imgTag}<span class="${creditClass}">Фото: ${escapeHtml(author)}</span>`
  })
}
