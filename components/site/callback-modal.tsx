"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { Phone } from "lucide-react"
import { CaptchaUiProvider } from "@/components/site/modals/captcha-ui-context"
import type { DisplayPhone } from "@/lib/contact-settings"

type CallbackContextValue = {
  open: () => void
  /** Подгрузить чанк модалки заранее (hover/focus/touchstart по триггеру). */
  preload: () => void
}

const CallbackContext = createContext<CallbackContextValue | null>(null)

export function useCallbackModal() {
  const ctx = useContext(CallbackContext)
  if (!ctx) throw new Error("useCallbackModal must be used within CallbackProvider")
  return ctx
}

const loadDialog = () => import("./callback-dialog")

/**
 * Диалог грузится отдельным чанком (motion + libphonenumber) и только после
 * первого намерения пользователя. ssr: false — до клика на сервере рендерить
 * нечего, а провайдер стоит в layout каждой страницы.
 */
const CallbackDialog = dynamic(loadDialog, { ssr: false })

/**
 * Провайдер получает уже вычисленные на сервере телефон и часы работы, а не
 * весь объект настроек CMS: раньше он сериализовался в HTML каждой страницы
 * целиком (~500 КБ вместе с политикой и текстами всех разделов).
 */
export function CallbackProvider({
  children,
  phone = null,
  hours = "10:00–18:00",
  captchaStatusVisible = false,
}: {
  children: React.ReactNode
  phone?: DisplayPhone | null
  hours?: string
  /** Уже учитывает и CMS-флаг, и разрешение стенда (dev only). */
  captchaStatusVisible?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const preload = useCallback(() => {
    void loadDialog()
  }, [])
  const open = useCallback(() => {
    setMounted(true)
    setIsOpen(true)
  }, [])
  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    }
  }, [])

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(close, 2500)
  }, [close])

  return (
    <CaptchaUiProvider statusVisible={captchaStatusVisible}>
      <CallbackContext.Provider value={{ open, preload }}>
        {children}

        <button
          type="button"
          onClick={open}
          onPointerEnter={preload}
          onTouchStart={preload}
          onFocus={preload}
          aria-label="Заказать звонок"
          className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-brand text-brand-foreground shadow-lg transition-transform duration-150 hover:scale-105 active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100 md:hidden"
        >
          <Phone className="h-6 w-6" strokeWidth={2} />
        </button>

        {mounted ? (
          <CallbackDialog
            open={isOpen}
            onClose={close}
            onSuccess={scheduleClose}
            phone={phone}
            hours={hours}
          />
        ) : null}
      </CallbackContext.Provider>
    </CaptchaUiProvider>
  )
}
