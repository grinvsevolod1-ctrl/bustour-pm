"use client"

import { useState } from "react"
import { formatPhoneIfComplete, isSupportedPhone, sanitizePhoneTyping, submitLead, validateLead } from "@/lib/lead"
import { captchaClientError } from "@/lib/recaptcha-public"
import {
  ModalCaptchaRow,
  ModalDivider,
  ModalField,
  ModalSubmitButton,
  ModalSuccess,
  SiteModalShell,
  modalFormClass,
  modalInputClass,
  modalTextareaClass,
  useScheduleModalClose,
} from "./site-modal-shell"

// Короткая форма по запросу владельца: имя, телефон, комментарий,
// согласие на обработку ПД и карточка заказываемого автобуса.
type Values = {
  name: string
  phone: string
  comment: string
  captcha: string
}

const initial: Values = {
  name: "",
  phone: "",
  comment: "",
  captcha: "",
}

export function ModalBusOrder({
  open,
  onClose,
  busTitle = "",
}: {
  open: boolean
  onClose: () => void
  busTitle?: string
}) {
  const scheduleClose = useScheduleModalClose(onClose)
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle")
  const [consent, setConsent] = useState(false)

  function set(field: keyof Values, value: string) {
    setValues((v) => ({ ...v, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next = validateLead({
      name: values.name,
      phone: values.phone,
      type: "rentbus",
    })
    if (!consent) next.consent = "Нужно согласие на обработку персональных данных"
    const captchaErr = captchaClientError(values.captcha)
    if (captchaErr) next.captcha = captchaErr
    if (Object.keys(next).length) {
      setErrors(next)
      return
    }

    setStatus("sending")
    const result = await submitLead({
      type: "rentbus",
      name: values.name.trim(),
      phone: values.phone,
      tour: busTitle,
      message: values.comment.trim() ? `Комментарий: ${values.comment.trim()}` : "",
      captchaToken: values.captcha || undefined,
      consent,
    })
    if (result.ok) {
      setStatus("sent")
      scheduleClose()
    } else {
      setStatus("idle")
      setErrors(result.errors)
    }
  }

  return (
    <SiteModalShell
      open={open}
      onClose={onClose}
      title="Заказать аренду автобуса"
      titleId="modal-bus-order-title"
      maxWidthClass="max-w-[480px]"
    >
      {status === "sent" ? (
        <ModalSuccess title="Заявка отправлена!" text="Мы свяжемся с вами в ближайшее время." />
      ) : (
        <form className={modalFormClass} onSubmit={handleSubmit} noValidate>
          {busTitle ? (
            <div className="rounded-md border border-line bg-cream/80 px-3 py-2">
              <p className="text-xs text-ink-muted">Автобус</p>
              <p className="truncate text-sm font-medium text-ink" title={busTitle}>
                {busTitle}
              </p>
            </div>
          ) : null}

          <ModalField label="Имя:" required error={errors.name}>
            <input
              name="name"
              autoComplete="name"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              className={modalInputClass(!!errors.name)}
              aria-invalid={!!errors.name}
            />
          </ModalField>

          <ModalField label="Телефон:" required error={errors.phone}>
            <input
              name="phone"
              autoComplete="tel"
              value={values.phone}
              onChange={(e) => set("phone", sanitizePhoneTyping(e.target.value))}
              onBlur={(e) => set("phone", formatPhoneIfComplete(e.target.value))}
              type="tel"
              inputMode="tel"
              className={modalInputClass(!!errors.phone)}
              aria-invalid={!!errors.phone}
            />
          </ModalField>

          <ModalField label="Комментарий к заявке:">
            <textarea
              value={values.comment}
              onChange={(e) => set("comment", e.target.value)}
              rows={3}
              className={modalTextareaClass}
            />
          </ModalField>

          <ModalDivider />
          <ModalCaptchaRow
            resetKey={open}
            action="rentbus"
            onChange={(v) => set("captcha", v)}
            error={errors.captcha}
          />
          <label className="flex cursor-pointer items-start gap-2 text-xs leading-4 text-ink">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked)
                if (errors.consent) setErrors((err) => ({ ...err, consent: "" }))
              }}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-line accent-brand"
            />
            <span>
              Согласен(на) на обработку{" "}
              <a href="/legal/privacy" className="underline underline-offset-2 hover:text-brand-dark">
                персональных данных
              </a>
              <span className="text-price"> *</span>
            </span>
          </label>
          {errors.consent ? (
            <p className="text-xs text-price" role="alert">
              {errors.consent}
            </p>
          ) : null}
          {errors.form ? (
            <p className="text-sm text-price" role="alert">
              {errors.form}
            </p>
          ) : null}
          <ModalSubmitButton
            pending={status === "sending"}
            consent={consent}
            captchaToken={values.captcha}
            phoneValid={isSupportedPhone(values.phone)}
          >
            Отправить заявку
          </ModalSubmitButton>
        </form>
      )}
    </SiteModalShell>
  )
}
