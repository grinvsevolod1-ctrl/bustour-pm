"use client"

import dynamic from "next/dynamic"
import type { ComponentProps } from "react"
import type { AnnouncementPopup } from "./announcement-popup"

/**
 * Попап открывается только на клиенте с задержкой 700 мс, поэтому серверный
 * рендер ему не нужен, а его motion-чанк не должен лежать в бандле layout,
 * где он был бы даже в дни без активного объявления.
 */
const LazyPopup = dynamic(
  () => import("./announcement-popup").then((m) => m.AnnouncementPopup),
  { ssr: false },
)

export function AnnouncementPopupLazy(props: ComponentProps<typeof AnnouncementPopup>) {
  return <LazyPopup {...props} />
}
