import { ImageResponse } from "next/og"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { CANONICAL_ORIGIN } from "@/lib/canonical-origin"

// Node runtime: читаем TTF-шрифты с диска через fs (в edge это недоступно).
export const runtime = "nodejs"
// Картинка зависит только от query-параметров — кэшируем надолго на CDN.
export const revalidate = 86400

const OG_WIDTH = 1200
const OG_HEIGHT = 630

// Шрифты Nunito с кириллицей лежат в репозитории (assets/og), чтобы генерация
// не зависела от внешней сети на сервере. Читаем один раз при старте модуля.
const fontDir = join(process.cwd(), "assets", "og")
const fontBold = readFileSync(join(fontDir, "Nunito-Bold.ttf"))
const fontSemiBold = readFileSync(join(fontDir, "Nunito-SemiBold.ttf"))
const fontRegular = readFileSync(join(fontDir, "Nunito-Regular.ttf"))

const BRAND = "#f0b336"
const INK = "#222222"
const CREAM = "#fff9ed"

function clamp(value: string | null, max: number): string {
  const s = (value || "").trim()
  if (s.length <= max) return s
  return `${s.slice(0, max - 1).trimEnd()}…`
}

/** Абсолютный URL картинки для фонового изображения баннера. */
function absolutize(src: string | null): string | null {
  const raw = (src || "").trim()
  if (!raw) return null
  if (/^https?:\/\//i.test(raw)) return raw
  return `${CANONICAL_ORIGIN}${raw.startsWith("/") ? raw : `/${raw}`}`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = clamp(searchParams.get("title"), 90) || "БасТур"
  const subtitle = clamp(searchParams.get("subtitle"), 70)
  const price = clamp(searchParams.get("price"), 40)
  const bg = absolutize(searchParams.get("img"))

  // Пытаемся подложить фото тура фоном. Если недоступно/ошибка — остаётся
  // фирменный кремовый фон, баннер всё равно валиден.
  let bgData: string | null = null
  if (bg) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 2500)
      const res = await fetch(bg, { signal: controller.signal })
      clearTimeout(timer)
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer())
        const type = res.headers.get("content-type") || "image/jpeg"
        bgData = `data:${type};base64,${buf.toString("base64")}`
      }
    } catch {
      bgData = null
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          position: "relative",
          backgroundColor: CREAM,
          fontFamily: "Nunito",
        }}
      >
        {bgData ? (
          <img
            src={bgData}
            width={OG_WIDTH}
            height={OG_HEIGHT}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : null}
        {/* Затемняющий градиент снизу для читаемости текста поверх фото */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background: bgData
              ? "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.82) 100%)"
              : "linear-gradient(180deg, #fff9ed 0%, #fdeecb 100%)",
          }}
        />

        {/* Верхняя плашка бренда */}
        <div
          style={{
            position: "absolute",
            top: 48,
            left: 56,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: BRAND,
              color: INK,
              fontFamily: "Nunito-Bold",
              fontSize: 34,
              padding: "10px 24px",
              borderRadius: 14,
            }}
          >
            БасТур
          </div>
        </div>

        {/* Контент */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            padding: "0 56px 56px 56px",
            maxWidth: 1040,
          }}
        >
          {subtitle ? (
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                fontFamily: "Nunito-SemiBold",
                fontSize: 30,
                color: bgData ? "#ffffff" : INK,
                backgroundColor: bgData ? "rgba(240,179,54,0.95)" : "rgba(240,179,54,0.25)",
                padding: "6px 18px",
                borderRadius: 10,
              }}
            >
              {subtitle}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              fontFamily: "Nunito-Bold",
              fontSize: 64,
              lineHeight: 1.1,
              color: bgData ? "#ffffff" : INK,
            }}
          >
            {title}
          </div>
          {price ? (
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 10,
                fontFamily: "Nunito-Bold",
                fontSize: 46,
                color: BRAND,
              }}
            >
              {price}
            </div>
          ) : null}
        </div>
      </div>
    ),
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      fonts: [
        { name: "Nunito", data: fontRegular, weight: 400, style: "normal" },
        { name: "Nunito-SemiBold", data: fontSemiBold, weight: 600, style: "normal" },
        { name: "Nunito-Bold", data: fontBold, weight: 700, style: "normal" },
      ],
    },
  )
}
