"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Mail, RefreshCw, Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/admin/ui"
import { sendTestNotificationAction } from "@/app/admin/integrations-actions"
import { cn } from "@/lib/utils"

/**
 * Кнопки панели интеграций. type="button" обязательно: панель живёт внутри
 * формы настроек, и обычная кнопка отправила бы всю форму.
 */
export function IntegrationsActionsBar({
  checkedAt,
  emailReady,
  telegramReady,
}: {
  checkedAt: string
  emailReady: boolean
  telegramReady: boolean
}) {
  const router = useRouter()
  const [sending, startSending] = useTransition()
  const [refreshing, startRefreshing] = useTransition()

  function sendTest(channel: "email" | "telegram") {
    startSending(async () => {
      const label = channel === "email" ? "E-mail" : "Telegram"
      const result = await sendTestNotificationAction(channel)
      if ("error" in result) {
        toast.error(`${label}: не отправлено`, { description: result.error, duration: 8000 })
        return
      }
      toast.success(`${label}: тест отправлен`, {
        description: channel === "email" ? "Проверьте почту получателей (и папку «Спам»)." : "Сообщение должно появиться в чате бота.",
      })
    })
  }

  const time = new Date(checkedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-admin-border pt-4">
      <Button type="button" variant="secondary" size="sm" disabled={sending || !emailReady} onClick={() => sendTest("email")}>
        <Mail className="h-3.5 w-3.5" aria-hidden />
        Тест e-mail
      </Button>
      <Button type="button" variant="secondary" size="sm" disabled={sending || !telegramReady} onClick={() => sendTest("telegram")}>
        <Send className="h-3.5 w-3.5" aria-hidden />
        Тест Telegram
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={refreshing}
        onClick={() => startRefreshing(() => router.refresh())}
        className="ml-auto"
      >
        <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} aria-hidden />
        Перепроверить
      </Button>
      <span className="text-xs text-admin-fg-subtle" aria-live="polite">
        {refreshing ? "Проверяю…" : `Проверено в ${time}`}
      </span>
    </div>
  )
}

/** Подставляет chat_id в поле «Telegram chat ID» той же формы, не сохраняя — владелец жмёт «Сохранить» сам. */
export function UseChatIdButton({ chatId }: { chatId: number }) {
  function apply() {
    const input = document.getElementById("sf-notify.telegramChatId") as HTMLInputElement | null
    if (!input) {
      toast.error("Поле «Telegram chat ID» не найдено на странице")
      return
    }
    input.value = String(chatId)
    // Нативное событие, чтобы форма отметилась как изменённая (useAdminDirtyForm).
    input.dispatchEvent(new Event("input", { bubbles: true }))
    input.focus()
    toast.success(`chat_id ${chatId} подставлен — нажмите «Сохранить изменения»`)
  }
  return (
    <Button type="button" variant="secondary" size="sm" onClick={apply}>
      Использовать
    </Button>
  )
}
