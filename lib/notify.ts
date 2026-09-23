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

export async function loadNotifyConfig(): Promise<NotifyChannelConfig> {
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

/**
 * Результат одной отправки. Текст ошибки — без секретов и без PII, его
 * показывает админке кнопка «Отправить тест» и пишет в лог notifyLead.
 */
export type SendResult = { ok: true } | { ok: false; error: string }

const SKIPPED: SendResult = { ok: false, error: "канал выключен или не настроен" }

async function sendViaSmtp(cfg: SmtpConfig, mail: LeadMail): Promise<SendResult> {
  try {
    const info = await getSmtpTransporter(cfg).sendMail(mail)
    if (!info.accepted?.length) {
      console.error("[notify] lead email (smtp) rejected for all recipients: %s", info.response)
      return { ok: false, error: `SMTP отклонил всех получателей: ${info.response}` }
    }
    return { ok: true }
  } catch (err) {
    const message = (err as Error).message
    console.error("[notify] lead email (smtp %s:%d) failed:", cfg.host, cfg.port, message)
    return { ok: false, error: `SMTP ${cfg.host}:${cfg.port} — ${message}` }
  }
}

async function sendViaResend(apiKey: string, mail: LeadMail): Promise<SendResult> {
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
      const body = await resp.text().catch(() => "")
      console.error("[notify] lead email notify failed: HTTP %d %s", resp.status, body)
      return { ok: false, error: `Resend HTTP ${resp.status}` }
    }
    return { ok: true }
  } catch (err) {
    console.error("[notify] lead email notify failed:", (err as Error).message)
    return { ok: false, error: `Resend — ${(err as Error).message}` }
  }
}

/**
 * Доставка в e-mail канал. Транспорт: SMTP почтового хостинга, если
 * сконфигурирован; иначе Resend.
 */
async function sendEmail(mail: Omit<LeadMail, "from" | "to">, config: NotifyChannelConfig): Promise<SendResult> {
  if (!config.emailEnabled || config.emailTo.length === 0) return SKIPPED
  const smtp = readSmtpConfig()
  const resendKey = process.env.RESEND_API_KEY
  if (!smtp && !resendKey) {
    // Канал включён, но не сконфигурирован — заявка уйдёт «в никуда»,
    // это должно быть видно в логах, а не выглядеть успехом.
    console.warn(
      "[notify] email channel enabled but neither SMTP_HOST/SMTP_USER/SMTP_PASS nor RESEND_API_KEY is set — lead email skipped",
    )
    return { ok: false, error: "не задан ни SMTP_HOST/SMTP_USER/SMTP_PASS, ни RESEND_API_KEY" }
  }
  const full: LeadMail = { ...mail, from: config.emailFrom, to: config.emailTo }
  return smtp ? sendViaSmtp(smtp, full) : sendViaResend(resendKey as string, full)
}

async function sendTelegram(text: string, config: NotifyChannelConfig): Promise<SendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = config.telegramChatId
  if (!token || !config.telegramEnabled) return SKIPPED
  if (!chatId) return { ok: false, error: "не задан chat_id (напишите боту и укажите ID в настройках)" }
  try {
    const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(NOTIFY_TIMEOUT_MS),
    })
    if (!resp.ok) {
      const description = await resp
        .json()
        .then((j: { description?: string }) => j.description ?? "")
        .catch(() => "")
      console.error("[notify] lead telegram notify failed: HTTP %d %s", resp.status, description)
      return { ok: false, error: `Telegram HTTP ${resp.status}${description ? ` — ${description}` : ""}` }
    }
    return { ok: true }
  } catch (err) {
    console.error("[notify] lead telegram notify failed:", (err as Error).message)
    return { ok: false, error: `Telegram — ${(err as Error).message}` }
  }
}

/**
 * Тестовое уведомление из админки: тот же конфиг и тот же транспорт, что и у
 * реальных заявок, поэтому успех здесь означает, что заявки дойдут.
 */
export async function sendTestNotification(channel: "email" | "telegram", sender: string): Promise<SendResult> {
  const config = await loadNotifyConfig()
  const when = new Date().toLocaleString("ru-RU", { timeZone: "Europe/Minsk" })
  const body = `Тестовое уведомление из админ-панели БасТур.\nОтправил: ${sender}\nВремя: ${when}\n\nЕсли вы видите это сообщение — канал настроен верно, заявки с сайта будут приходить сюда.`
  if (channel === "email") {
    return sendEmail({ subject: "Тест уведомлений — БасТур", text: body }, config)
  }
  return sendTelegram("🔔 " + body, config)
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
  const mail = {
    // Менеджер отвечает клиенту прямо из письма, а не копирует адрес из текста.
    replyTo: data.email?.trim() || undefined,
    subject: `${typeLabel(data.type)} — БасТур`,
    text: lines.join("\n"),
  }
  const [emailRes, tgRes] = await Promise.allSettled([
    sendEmail(mail, config),
    sendTelegram("🔔 Новая заявка с сайта БасТур\n\n" + lines.join("\n"), config),
  ])
  const emailOk = emailRes.status === "fulfilled" && emailRes.value.ok
  const tgOk = tgRes.status === "fulfilled" && tgRes.value.ok
  // Итоговая строка по cid: по логам видно, ушла ли заявка хоть куда-то.
  // Заявка при этом всегда сохранена в БД (lead создаётся до notifyLead).
  console.info("[notify] lead cid=%s email=%s telegram=%s", meta.correlationId, emailOk, tgOk)
  if (!emailOk && !tgOk) {
    console.error("[notify] lead cid=%s delivered to NO channels — проверьте настройки уведомлений", meta.correlationId)
  }
}
