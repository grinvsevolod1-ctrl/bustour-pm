"use client"

import { createContext, useContext } from "react"

/**
 * Вынесено из site-modal-shell отдельным модулем без зависимостей: провайдер
 * живёт в layout каждой страницы, и раньше через него весь shell (motion,
 * reCAPTCHA-лоадер) попадал в первичный бандл. Теперь layout тянет только
 * этот контекст, а shell грузится вместе с модалкой по клику.
 */
export type CaptchaUiValue = { statusVisible: boolean }

const CaptchaUiContext = createContext<CaptchaUiValue>({ statusVisible: false })

export function CaptchaUiProvider({
  statusVisible = false,
  children,
}: {
  statusVisible?: boolean
  children: React.ReactNode
}) {
  return (
    <CaptchaUiContext.Provider value={{ statusVisible }}>{children}</CaptchaUiContext.Provider>
  )
}

export function useCaptchaUi(): CaptchaUiValue {
  return useContext(CaptchaUiContext)
}
