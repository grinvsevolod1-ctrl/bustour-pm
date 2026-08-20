import { NextResponse } from "next/server"
import { ensureDb, pingDb } from "@/lib/db/init"
import { isFfmpegAvailable } from "@/lib/media/ffmpeg"

export const runtime = "nodejs"

export async function GET() {
  try {
    await ensureDb()
    await pingDb()
    // ffmpeg отдаём отдельным флагом: его отсутствие не критично для работы
    // сайта, но означает, что видео не конвертируется в WebM. Ops может свериться
    // с этим полем после деплоя, не роясь в логах.
    const ffmpeg = await isFfmpegAvailable().catch(() => false)
    return NextResponse.json({ ok: true, ffmpeg })
  } catch (error) {
    // Log details server-side only — DB error messages can leak host/user info.
    console.error("[health] check failed:", error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false }, { status: 503 })
  }
}
