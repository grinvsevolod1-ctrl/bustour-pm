import type { ReactNode } from "react"
import { getIntegrationsStatus, type CheckTone } from "@/lib/integrations-status"
import { Badge } from "@/components/admin/ui"
import { IntegrationsActionsBar, UseChatIdButton } from "@/components/admin/integrations-actions-bar"
import { cn } from "@/lib/utils"

const TONE_BADGE: Record<CheckTone, { tone: "green" | "amber" | "red" | "neutral"; label: string }> = {
  ok: { tone: "green", label: "Работает" },
  warn: { tone: "amber", label: "Требует внимания" },
  error: { tone: "red", label: "Ошибка" },
  off: { tone: "neutral", label: "Выключено" },
}

const TONE_DOT: Record<CheckTone, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  error: "bg-red-500",
  off: "bg-admin-fg-subtle",
}

function StatusRow({
  tone,
  title,
  summary,
  children,
}: {
  tone: CheckTone
  title: string
  summary: string
  children?: ReactNode
}) {
  const badge = TONE_BADGE[tone]
  return (
    <li className="flex gap-3 py-3 first:pt-0 last:pb-0">
      <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", TONE_DOT[tone])} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-admin-fg">{title}</span>
          <Badge tone={badge.tone}>{badge.label}</Badge>
        </div>
        <p className="mt-0.5 text-sm text-pretty text-admin-fg-muted">{summary}</p>
        {children}
      </div>
    </li>
  )
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex gap-2 text-xs">
      <dt className="shrink-0 text-admin-fg-subtle">{label}</dt>
      <dd className="min-w-0 break-all font-mono text-admin-fg-muted">{value}</dd>
    </div>
  )
}

/**
 * Живой статус каналов уведомлений и CRM. Рендерится на сервере при каждом
 * открытии настроек: владелец видит, что реально настроено на проде, без SSH.
 */
export async function IntegrationsStatusPanel() {
  const status = await getIntegrationsStatus()
  const { email, telegram, crm, captcha } = status

  return (
    <section
      aria-labelledby="integrations-status-heading"
      className="rounded-lg border border-admin-border bg-admin-bg p-4"
    >
      <h3 id="integrations-status-heading" className="text-sm font-semibold text-admin-fg">
        Состояние каналов на сервере
      </h3>
      <ul className="mt-3 divide-y divide-admin-border">
        <StatusRow tone={email.tone} title="E-mail" summary={email.summary}>
          {email.transport !== "none" ? (
            <dl className="mt-2 flex flex-col gap-1">
              {email.host ? <Detail label="Сервер" value={`${email.host} (${email.user})`} /> : null}
              <Detail label="От кого" value={email.from} />
              <Detail label="Кому" value={email.to.join(", ")} />
            </dl>
          ) : null}
        </StatusRow>

        <StatusRow tone={telegram.tone} title="Telegram" summary={telegram.summary}>
          {telegram.chats.length ? (
            <ul className="mt-2 flex flex-col gap-1.5">
              {telegram.chats.map((chat) => {
                const active = telegram.chatId === String(chat.id)
                return (
                  <li
                    key={chat.id}
                    className="flex flex-wrap items-center gap-2 rounded-md border border-admin-border bg-white px-2.5 py-1.5 text-xs"
                  >
                    <code className="font-mono text-admin-fg">{chat.id}</code>
                    <span className="text-admin-fg-muted">
                      {chat.title || "без названия"} · {chat.type}
                    </span>
                    {active ? (
                      <Badge tone="green" className="ml-auto">
                        {telegram.chatIdSource === "settings" ? "выбран в настройках" : "из окружения"}
                      </Badge>
                    ) : (
                      <span className="ml-auto">
                        <UseChatIdButton chatId={chat.id} />
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : null}
        </StatusRow>

        <StatusRow tone={crm.tone} title="CRM U-ON" summary={crm.summary} />

        <StatusRow tone={captcha.tone} title="Капча на формах" summary={captcha.summary} />
      </ul>

      <IntegrationsActionsBar
        checkedAt={status.checkedAt}
        emailReady={email.enabled && email.transport !== "none"}
        telegramReady={telegram.enabled && telegram.tokenSet && Boolean(telegram.chatId)}
      />
    </section>
  )
}

export function IntegrationsStatusSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="Проверяю состояние каналов"
      className="rounded-lg border border-admin-border bg-admin-bg p-4"
    >
      <div className="h-4 w-56 animate-pulse rounded bg-admin-muted" />
      <ul className="mt-3 divide-y divide-admin-border">
        {["E-mail", "Telegram", "CRM U-ON", "Капча на формах"].map((title) => (
          <li key={title} className="flex gap-3 py-3 first:pt-0 last:pb-0">
            <span className="mt-1.5 h-2 w-2 shrink-0 animate-pulse rounded-full bg-admin-muted" aria-hidden />
            <div className="flex-1">
              <span className="text-sm font-medium text-admin-fg">{title}</span>
              <div className="mt-1.5 h-3 w-3/4 animate-pulse rounded bg-admin-muted" />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-admin-border pt-4 text-xs text-admin-fg-subtle">
        Проверяю SMTP, Telegram и U-ON…
      </p>
    </section>
  )
}
