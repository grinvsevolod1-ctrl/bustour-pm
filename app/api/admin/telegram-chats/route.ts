import { requireAdmin } from "@/lib/auth"

export const dynamic = "force-dynamic"

const TIMEOUT_MS = 10_000

type TgChat = { id: number; type: string; title?: string; first_name?: string; last_name?: string; username?: string }
type TgUpdate = {
  update_id: number
  message?: { chat: TgChat }
  edited_message?: { chat: TgChat }
  channel_post?: { chat: TgChat }
  my_chat_member?: { chat: TgChat }
}

async function tg<T>(token: string, method: string, body?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; result?: T; description?: string }
  if (!res.ok || !json.ok) throw new Error(json.description || `HTTP ${res.status}`)
  return json.result as T
}

/**
 * Диагностика для админа: какие чаты «видит» бот, чтобы взять chat_id для
 * поля «Telegram chat_id» в Настройках → Уведомления. Токен наружу не
 * отдаём — только имя бота и найденные чаты.
 */
export async function GET() {
  const admin = await requireAdmin().catch(() => null)
  if (!admin) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 })

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
  if (!token) return Response.json({ ok: false, error: "TELEGRAM_BOT_TOKEN не задан на сервере" })

  try {
    const me = await tg<{ username: string }>(token, "getMe")
    const updates = await tg<TgUpdate[]>(token, "getUpdates", { limit: 100, timeout: 0 })
    const chats = new Map<number, { id: number; type: string; title: string }>()
    for (const u of updates) {
      const chat = u.message?.chat ?? u.edited_message?.chat ?? u.channel_post?.chat ?? u.my_chat_member?.chat
      if (!chat) continue
      const title = chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(" ") || chat.username || ""
      chats.set(chat.id, { id: chat.id, type: chat.type, title })
    }
    return Response.json({
      ok: true,
      bot: `@${me.username}`,
      configuredChatId: process.env.TELEGRAM_CHAT_ID?.trim() || null,
      chats: [...chats.values()],
      hint: chats.size
        ? "Скопируйте id нужного чата в Настройки → Уведомления → Telegram chat_id"
        : `Боту ещё никто не писал: откройте t.me/${me.username}, нажмите Start и обновите страницу`,
    })
  } catch (err) {
    return Response.json({ ok: false, error: (err as Error).message })
  }
}
