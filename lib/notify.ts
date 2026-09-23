import { createHash } from "node:crypto"
import { createTransport, type Transporter } from "nodemailer"
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
/** SMTP-рукопожатие по SSL медленнее одного HTTP-запроса; notifyLead и так вызывается fire-and-forget. */
const SMTP_TIMEOUT_MS = 15_000

export type SmtpConfig = { host: string; port: number; secure: boolean; user: string; pass: string }

/**
 * SMTP включается только при полном наборе SMTP_HOST/SMTP_USER/SMTP_PASS.
 * Порт по умолчанию 465 (implicit SSL/TLS — так у hoster.by); для 587
 * secure=false, и nodemailer сам поднимет STARTTLS.
 */
export function readSmtpConfig(env: NodeJS.ProcessEnv = process.env): SmtpConfig | null {
  const host = env.SMTP_HOST?.trim()
  const user = env.SMTP_USER?.trim()
  const pass = env.SMTP_PASS
  if (!host || !user || !pass) return null
  const port = Number.parseInt(env.SMTP_PORT ?? "", 10) || 465
  const secureRaw = env.SMTP_SECURE?.trim().toLowerCase()
  const secure = secureRaw ? !["0", "false", "no"].includes(secureRaw) : port === 465
  return { host, port, secure, user, pass }
}

let smtpTransport: { signature: string; transporter: Transporter } | null = null

/** Транспорт кэшируется на процесс; смена пароля подхватится после pm2 reload (он и так идёт с деплоем). */
function getSmtpTransporter(cfg: SmtpConfig): Transporter {
  const signature = `${cfg.host}:${cfg.port}:${cfg.secure}:${cfg.user}`
  if (smtpTransport?.signature === signature) return smtpTransport.transporter
  const transporter = createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
  })
  smtpTransport = { signature, transporter }
  return transporter
}

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
  // Без явных адресов при SMTP заявки идут в сам почтовый ящик отправителя —
  // это гарантированно существующий адрес, который читает владелец.
  const smtp = readSmtpConfig()
  const fallbackTo = smtp ? [smtp.user] : ["info@bastur.by"]
  const fallbackFrom = smtp ? `БасТур <${smtp.user}>` : "БасТур <onboarding@resend.dev>"
  return {
    emailEnabled: (settings["notify.emailEnabled"] ?? "true") !== "false",
    emailTo: emailToSetting.length ? emailToSetting : emailToEnv.length ? emailToEnv : fallbackTo,
    emailFrom: settings["notify.emailFrom"]?.trim() || process.env.LEAD_EMAIL_FROM || fallbackFrom,
    telegramEnabled: (settings["notify.telegramEnabled"] ?? "true") !== "false",
    telegramChatId: settings["notify.telegramChatId"]?.trim() || process.env.TELEGRAM_CHAT_ID || "",
  }
}

type LeadMail = { from: string; to: string[]; replyTo?: string; subject: string; text: string }

async function sendViaSmtp(cfg: SmtpConfig, mail: LeadMail): Promise<boolean> {
  try {
    const info = await getSmtpTransporter(cfg).sendMail(mail)
    if (!info.accepted?.length) {
      console.error("[notify] lead email (smtp) rejected for all recipients: %s", info.response)
      return false
    }
    return true
  } catch (err) {
    console.error("[notify] lead email (smtp %s:%d) failed:", cfg.host, cfg.port, (err as Error).message)
    return false
  }
}

async function sendViaResend(apiKey: string, mail: LeadMail): Promise<boolean> {
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: mail.from,
        to: mail.to,
        reply_to: mail.replyTo,
        subject: mail.subject,
        text: mail.text,
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

/**
 * Возвращает true при подтверждённой доставке в API канала.
 * Транспорт: SMTP почтового хостинга, если сконфигурирован; иначе Resend.
 */
async function sendEmail(data: LeadData, lines: string[], config: NotifyChannelConfig): Promise<boolean> {
  if (!config.emailEnabled || config.emailTo.length === 0) return false
  const smtp = readSmtpConfig()
  const resendKey = process.env.RESEND_API_KEY
  if (!smtp && !resendKey) {
    // Канал включён, но не сконфигурирован — заявка уйдёт «в никуда»,
    // это должно быть видно в логах, а не выглядеть успехом.
    console.warn(
      "[notify] email channel enabled but neither SMTP_HOST/SMTP_USER/SMTP_PASS nor RESEND_API_KEY is set — lead email skipped",
    )
    return false
  }
  const mail: LeadMail = {
    from: config.emailFrom,
    to: config.emailTo,
    // Менеджер отвечает клиенту прямо из письма, а не копирует адрес из текста.
    replyTo: data.email?.trim() || undefined,
    subject: `${typeLabel(data.type)} — БасТур`,
    text: lines.join("\n"),
  }
  return smtp ? sendViaSmtp(smtp, mail) : sendViaResend(resendKey as string, mail)
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
