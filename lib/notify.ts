import { createHash } from "node:crypto"
import type { LeadType } from "@/lib/types"

export type LeadData = {
  name: string
  phone: string
  email?: string | null
  message?: string | null
  tour?: string | null
  type: LeadType
  /**
   * Готовый correlation-тег, если вызывающий код передаёт в `phone` уже
   * хешированное значение (отзывы). Без него buildSafeMeta хешировал бы
   * хеш повторно, и cid в логах не совпадал бы с CorrelationId в уведомлении.
   */
  correlationId?: string
}

function typeLabel(type: LeadType) {
  if (type === "booking") return "Бронирование тура"
  if (type === "callback") return "Заказ звонка"
  if (type === "rentbus") return "Аренда автобуса"
  return "Обращение с сайта"
}

/** SHA-256 hex 12 chars — deterministic correlation tag without exposing PII. */
export function phoneCorrelationTag(phone: string): string {
  const clean = phone.replace(/[^\d+]/g, "")
  const hash = createHash("sha256").update(clean, "utf8").digest("hex")
  return hash.slice(0, 12)
}

function buildLines(data: LeadData): string[] {
  return [
    `Тип заявки: ${typeLabel(data.type)}`,
    `Имя: ${data.name}`,
    `Телефон: ${data.phone}`,
    data.email ? `E-mail: ${data.email}` : "",
    data.tour ? `Тур: ${data.tour}` : "",
    data.message ? `Сообщение: ${data.message}` : "",
  ].filter(Boolean) as string[]
}

/** Hard timeout for outbound notification calls — a hung API must never stall the app. */
const NOTIFY_TIMEOUT_MS = 5_000

/** Notification channel config: admin settings (DB) override env vars. */
export type NotifyChannelConfig = {
  emailEnabled: boolean
  emailTo: string[]
  emailFrom: string
  telegramEnabled: boolean
  telegramChatId: string
}

function parseEmailList(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))
}

async function loadNotifyConfig(): Promise<NotifyChannelConfig> {
  let settings: Record<string, string> = {}
  try {
    const { getSettings } = await import("@/lib/cms")
    settings = await getSettings()
  } catch (err) {
    console.error("[notify] settings load failed, falling back to env:", (err as Error).message)
  }
  const emailToSetting = parseEmailList(settings["notify.emailTo"] ?? "")
  const emailToEnv = parseEmailList(process.env.LEAD_EMAIL_TO ?? "")
  return {
    emailEnabled: (settings["notify.emailEnabled"] ?? "true") !== "false",
    emailTo: emailToSetting.length ? emailToSetting : emailToEnv.length ? emailToEnv : ["info@bastur.by"],
    emailFrom:
      settings["notify.emailFrom"]?.trim() || process.env.LEAD_EMAIL_FROM || "БасТур <onboarding@resend.dev>",
    telegramEnabled: (settings["notify.telegramEnabled"] ?? "true") !== "false",
    telegramChatId: settings["notify.telegramChatId"]?.trim() || process.env.TELEGRAM_CHAT_ID || "",
  }
}

/** Возвращает true при подтверждённой доставке в API канала. */
async function sendEmail(data: LeadData, lines: string[], config: NotifyChannelConfig): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !config.emailEnabled || config.emailTo.length === 0) {
    if (!apiKey && config.emailEnabled) {
      // Канал включён, но не сконфигурирован — заявка уйдёт «в никуда»,
      // это должно быть видно в логах, а не выглядеть успехом.
      console.warn("[notify] email channel enabled but RESEND_API_KEY is not set — lead email skipped")
    }
    return false
  }
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: config.emailFrom,
        to: config.emailTo,
        subject: `${typeLabel(data.type)} — БасТур`,
        text: lines.join("\n"),
      }),
      signal: AbortSignal.timeout(NOTIFY_TIMEOUT_MS),
    })
    if (!resp.ok) {
      // Раньше не-2xx от Resend молча считался успехом.
      console.error("[notify] lead email notify failed: HTTP %d %s", resp.status, await resp.text().catch(() => ""))
      return false
    }
    return true
  } catch (err) {
    console.error("[notify] lead email notify failed:", (err as Error).message)
    return false
  }
}

async function sendTelegram(lines: string[], config: NotifyChannelConfig): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = config.telegramChatId
  if (!token || !chatId || !config.telegramEnabled) return false
  try {
    const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "🔔 Новая заявка с сайта БасТур\n\n" + lines.join("\n"),
      }),
      signal: AbortSignal.timeout(NOTIFY_TIMEOUT_MS),
    })
    if (!resp.ok) {
      console.error("[notify] lead telegram notify failed: HTTP %d", resp.status)
      return false
    }
    return true
  } catch (err) {
    console.error("[notify] lead telegram notify failed:", (err as Error).message)
    return false
  }
}

export function buildSafeMeta(data: LeadData) {
  const correlationId = data.correlationId || phoneCorrelationTag(data.phone)
  return {
    type: data.type,
    hasName: Boolean(data.name?.trim()),
    hasEmail: Boolean(data.email?.trim()),
    hasMessage: Boolean(data.message?.trim()),
    hasTour: Boolean(data.tour?.trim()),
    correlationId,
  }
}

// Notifies via all configured channels. Never throws — delivery is best-effort.
export async function notifyLead(data: LeadData) {
  const meta = buildSafeMeta(data)
  console.info(
    "[notify] lead type=%s name=%s email=%s msg=%s tour=%s cid=%s status=pending",
    meta.type,
    meta.hasName,
    meta.hasEmail,
    meta.hasMessage,
    meta.hasTour,
    meta.correlationId,
  )
  const lines = buildLines(data)
  const config = await loadNotifyConfig()
  const [emailRes, tgRes] = await Promise.allSettled([sendEmail(data, lines, config), sendTelegram(lines, config)])
  const emailOk = emailRes.status === "fulfilled" && emailRes.value
  const tgOk = tgRes.status === "fulfilled" && tgRes.value
  // Итоговая строка по cid: по логам видно, ушла ли заявка хоть куда-то.
  // Заявка при этом всегда сохранена в БД (lead создаётся до notifyLead).
  console.info("[notify] lead cid=%s email=%s telegram=%s", meta.correlationId, emailOk, tgOk)
  if (!emailOk && !tgOk) {
    console.error("[notify] lead cid=%s delivered to NO channels — проверьте настройки уведомлений", meta.correlationId)
  }
}
