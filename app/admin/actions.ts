"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { clientIpFromHeaders, consumePersistentRateLimit, resetPersistentRateLimit } from "@/lib/rate-limit"
import { login, logout, requireAdmin, requireCapability } from "@/lib/auth"
import { writeAudit, auditTourSnapshot } from "@/lib/admin-audit"
import { safeInternalNext } from "@/lib/safe-next"
import { isRedirectError, mutateThenRedirect } from "@/lib/admin-redirect"
import { reviewInputSchema } from "@/lib/review-schema"
import { sanitizeReviewShowOn } from "@/lib/review-admin"
import {
  createReview,
  updateReview,
  deleteReview,
  restoreReview,
  purgeReview,
  approveReview,
  setReviewShowOn,
  getReviewById,
  createArticle,
  updateArticleBase,
  deleteArticle,
  restoreArticle,
  purgeArticle,
  updateLeadStatus,
  deleteLead,
  restoreLead,
  purgeLead,
  type ReviewInput,
  type ArticleInput,
  getArticleById,
  findArticleIdBySlug,
} from "@/lib/queries"
import { isArticleCategory } from "@/lib/types"
import { rekeyPageScopedContent } from "@/lib/page-rekey"
import { slugify } from "@/lib/slug"
import type { Lead } from "@/lib/types"
import { mapDbError } from "@/lib/db-errors"
import { articleSaveSchema, zodFirstError } from "@/lib/validations/admin"

/* ---------------- Auth ---------------- */

const LOGIN_RATE_WINDOW = 15 * 60_000 // 15 minutes
const LOGIN_RATE_MAX = 10 // attempts per IP in window

export async function loginAction(_prev: unknown, formData: FormData) {
  const username = String(formData.get("username") || "").trim()
  const password = String(formData.get("password") || "")
  if (!username || !password) {
    return { error: "Введите логин и пароль" }
  }

  // Brute-force protection: limit attempts per IP; counter resets on success.
  // Лимит стойкий (таблица rate_limits): автодеплой рестартует pm2 на каждый
  // пуш в main, и in-memory счётчики брутфорса обнулялись за минуты.
  const ip = clientIpFromHeaders(await headers())
  const rate = await consumePersistentRateLimit("login", ip, LOGIN_RATE_MAX, LOGIN_RATE_WINDOW)
  if (!rate.ok) {
    return { error: `Слишком много попыток входа. Повторите через ${Math.ceil(rate.retryAfterSec / 60)} мин.` }
  }
  // Второй bucket по логину: распределённый перебор одного аккаунта
  // со многих IP не обойдёт лимит по IP, поэтому считаем и по username.
  const userKey = username.toLowerCase()
  const userRate = await consumePersistentRateLimit("login-user", userKey, LOGIN_RATE_MAX, LOGIN_RATE_WINDOW)
  if (!userRate.ok) {
    return { error: `Слишком много попыток входа. Повторите через ${Math.ceil(userRate.retryAfterSec / 60)} мин.` }
  }

  try {
    const ok = await login(username, password)
    if (!ok) {
      return { error: "Неверный логин или пароль" }
    }
    await resetPersistentRateLimit("login", ip)
    await resetPersistentRateLimit("login-user", userKey)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes("AUTH_SECRET")) {
      return { error: "Сервер не настроен (AUTH_SECRET). Обратитесь к администратору." }
    }
    throw err
  }
  redirect(safeInternalNext(String(formData.get("next") || "")) || "/admin")
}

export async function logoutAction() {
  await logout()
  redirect("/admin/login")
}

/* ---------------- Tours ----------------
 * Туровые actions вынесены в app/admin/tour-actions.ts — файлы с "use server"
 * не могут реэкспортировать, поэтому импортируй их оттуда напрямую. */

/* ---------------- Buses / Transfers ----------------
 * Вынесены в app/admin/bus-actions.ts и app/admin/transfer-actions.ts —
 * файлы с "use server" не могут реэкспортировать, импортируй напрямую. */

/* ---------------- Reviews ---------------- */

function revalidateReviewsPublic() {
  revalidatePath("/admin/reviews")
  revalidatePath("/")
  revalidatePath("/testimonials")
}

export async function saveReviewAction(_prev: unknown, formData: FormData) {
  const admin = await requireAdmin()
  const videoUrl = String(formData.get("videoUrl") || "").trim()
  // Explicit toggle from the form; fall back to auto-detect for older callers.
  const submittedType = formData.get("type")
  const type = submittedType === "VIDEO" || submittedType === "TEXT" ? submittedType : videoUrl ? "VIDEO" : "TEXT"
  const raw = {
    type,
    name: String(formData.get("name") || ""),
    tour: String(formData.get("tour") || ""),
    text: String(formData.get("text") || ""),
    rating: formData.get("rating") || 5,
    videoUrl,
    thumbnailUrl: String(formData.get("thumbnailUrl") || "").trim(),
  }
  const parsed = reviewInputSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте заполнение полей" }
  }
  const data = parsed.data
  const input: ReviewInput = {
    type: data.type,
    name: data.name,
    tour: data.tour,
    text: data.text,
    rating: data.rating,
    videoUrl: data.type === "VIDEO" ? data.videoUrl : "",
    thumbnailUrl: data.thumbnailUrl,
  }
  const id = Number(formData.get("id") || 0)
  try {
    if (id) {
      await updateReview(id, input)
      if (!input.tour.trim()) {
        const current = await getReviewById(id)
        if (current?.showOn.includes("tour")) {
          await setReviewShowOn(id, sanitizeReviewShowOn(current.showOn, false))
        }
      }
      await writeAudit({
        admin,
        action: "review_update",
        entityType: "review",
        entityId: id,
        summary: `Обновлён отзыв «${input.name}»`,
        after: { id, ...input },
      })
    } else {
      await createReview(input)
      await writeAudit({
        admin,
        action: "review_create",
        entityType: "review",
        summary: `Создан отзыв «${input.name}»`,
        after: input,
      })
    }
  } catch (err) {
    return { error: mapDbError(err, "Не удалось сохранить отзыв") }
  }
  revalidateReviewsPublic()
  // redirect() throws — must stay outside try/catch (#55)
  if (id) redirect(`/admin/reviews?notice=${encodeURIComponent("Отзыв сохранён")}#reviews-list`)
  return { success: true }
}

export async function deleteReviewAction(formData: FormData) {
  const admin = await requireAdmin()
  const id = Number(formData.get("id") || 0)
  return mutateThenRedirect(
    async () => {
      if (id) await deleteReview(id)
      await writeAudit({
        admin,
        action: "review_archive",
        entityType: "review",
        entityId: id,
        summary: `В архив отзыв #${id}`,
      })
      revalidatePath("/admin/archive")
      revalidateReviewsPublic()
    },
    "/admin/reviews?notice=archived",
    "/admin/reviews",
  )
}

export async function restoreReviewAction(formData: FormData) {
  const admin = await requireAdmin()
  const id = Number(formData.get("id") || 0)
  return mutateThenRedirect(
    async () => {
      if (id) await restoreReview(id)
      await writeAudit({
        admin,
        action: "review_restore",
        entityType: "review",
        entityId: id,
        summary: `Восстановлен отзыв #${id}`,
      })
      revalidatePath("/admin/archive")
      revalidateReviewsPublic()
    },
    "/admin/archive?notice=restored",
    "/admin/archive",
  )
}

export async function purgeReviewAction(formData: FormData) {
  const admin = await requireCapability("purge")
  const id = Number(formData.get("id") || 0)
  return mutateThenRedirect(
    async () => {
      if (id) await purgeReview(id)
      await writeAudit({
        admin,
        action: "review_purge",
        entityType: "review",
        entityId: id,
        summary: `Удалён отзыв #${id}`,
      })
      revalidatePath("/admin/archive")
      revalidateReviewsPublic()
    },
    "/admin/archive?notice=purged",
    "/admin/archive",
  )
}

export async function approveReviewAction(formData: FormData) {
  const admin = await requireAdmin()
  const id = Number(formData.get("id") || 0)
  const approved = formData.get("approved") === "1"
  if (id) await approveReview(id, approved)
  await writeAudit({
    admin,
    action: "review_approve",
    entityType: "review",
    entityId: id,
    summary: approved ? `Одобрен отзыв #${id}` : `Снято одобрение отзыва #${id}`,
    after: { approved },
  })
  revalidateReviewsPublic()
}

export async function setReviewShowOnAction(formData: FormData) {
  const admin = await requireAdmin()
  const id = Number(formData.get("id") || 0)
  const raw = String(formData.get("showOn") || "[]")
  let showOn: string[]
  try {
    const parsed = JSON.parse(raw)
    showOn = Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return
  }
  if (!id) return
  const review = await getReviewById(id)
  if (!review) return
  showOn = sanitizeReviewShowOn(showOn, Boolean(review.tour.trim()))
  await setReviewShowOn(id, showOn)
  await writeAudit({
    admin,
    action: "review_show_on",
    entityType: "review",
    entityId: id,
    summary: `Обновлены страницы показа отзыва #${id}`,
    after: { showOn },
  })
  revalidateReviewsPublic()
}

/* ---------------- Articles ---------------- */

export async function saveArticleAction(_prev: unknown, formData: FormData) {
  const admin = await requireAdmin()
  const id = Number(formData.get("id") || 0)
  const existingArticle = id ? await getArticleById(id) : undefined
  const title = String(formData.get("title") || "").trim()

  function truncateSlug(raw: string, maxLen = 120): string {
    const trimmed = raw.trim()
    if (trimmed.length <= maxLen) return trimmed
    const limited = trimmed.slice(0, maxLen + 1)
    const lastDash = limited.lastIndexOf("-")
    let boundary = maxLen
    if (lastDash >= 2 && lastDash < maxLen + 1) boundary = lastDash
    const next = trimmed.slice(0, boundary).replace(/-+$/, "")
    return next || trimmed.slice(0, maxLen).replace(/-+$/, "")
  }

  const rawSlug = truncateSlug(String(formData.get("slug") || "").trim() || title)
  const input: ArticleInput = {
    slug: slugify(rawSlug),
    title,
    category: (() => {
      const value = String(formData.get("category") || "")
      return isArticleCategory(value) ? value : "news"
    })(),
    excerpt: formData.has("excerpt")
      ? String(formData.get("excerpt") || "").trim()
      : existingArticle?.excerpt || "",
    image:
      String(formData.get("image") || "").trim() ||
      existingArticle?.image ||
      "/images/caucasus.png",
    date: String(formData.get("date") || "").trim(),
    content: String(formData.get("content") || "")
      .split("\n\n")
      .map((p) => p.trim())
      .filter(Boolean),
    contentHtml: String(formData.get("contentHtml") || ""),
    metaTitle: String(formData.get("metaTitle") || "").trim(),
    metaDescription: String(formData.get("metaDescription") || "").trim(),
    metaShortDesc: String(formData.get("metaShortDesc") || "").trim(),
    metaImage: String(formData.get("metaImage") || "").trim(),
    metaImageAlt: String(formData.get("metaImageAlt") || "").trim(),
  }
  if (!input.title) {
    return { error: "Заполните заголовок" }
  }
  const articleCheck = articleSaveSchema.safeParse({
    slug: input.slug,
    title: input.title,
    date: input.date,
    metaTitle: input.metaTitle,
    metaDescription: input.metaDescription,
    metaShortDesc: input.metaShortDesc,
    metaImage: input.metaImage,
    metaImageAlt: input.metaImageAlt,
  })
  if (!articleCheck.success) return { error: zodFirstError(articleCheck.error) }
  const slugOwner = await findArticleIdBySlug(input.slug)
  if (slugOwner && slugOwner !== id) {
    return { error: `Статья со slug «${input.slug}» уже существует — укажите другой slug` }
  }
  try {
    if (id) {
      if (existingArticle && existingArticle.slug !== input.slug) {
        await rekeyPageScopedContent(`article:${existingArticle.slug}`, `article:${input.slug}`)
      }
      await updateArticleBase(id, input)
      await writeAudit({
        admin,
        action: "article_update",
        entityType: "article",
        entityId: id,
        summary: `Обновлена статья «${input.title}»`,
        after: { id, slug: input.slug, title: input.title, category: input.category },
      })
      revalidatePath("/admin/articles")
      revalidatePath("/helpful")
      revalidatePath(`/helpful/${input.slug}`)
      if (existingArticle && existingArticle.slug !== input.slug) {
        revalidatePath(`/helpful/${existingArticle.slug}`)
      }
      return { success: true }
    } else {
      await createArticle(input)
      await writeAudit({
        admin,
        action: "article_create",
        entityType: "article",
        entityId: input.slug,
        summary: `Создана статья «${input.title}»`,
        after: { slug: input.slug, title: input.title, category: input.category },
      })
    }
  } catch (err) {
    return { error: mapDbError(err, "Не удалось сохранить статью") }
  }
  revalidatePath("/admin/articles")
  revalidatePath("/helpful")
  revalidatePath(`/helpful/${input.slug}`)
  redirect("/admin/articles")
}

export async function deleteArticleAction(formData: FormData) {
  const admin = await requireAdmin()
  const id = Number(formData.get("id") || 0)
  return mutateThenRedirect(
    async () => {
      if (id) await deleteArticle(id)
      await writeAudit({
        admin,
        action: "article_archive",
        entityType: "article",
        entityId: id,
        summary: `В архив статья #${id}`,
      })
      revalidatePath("/admin/articles")
      revalidatePath("/admin/archive")
      revalidatePath("/helpful")
    },
    "/admin/articles?notice=archived",
    "/admin/articles",
  )
}

export async function restoreArticleAction(formData: FormData) {
  const admin = await requireAdmin()
  const id = Number(formData.get("id") || 0)
  return mutateThenRedirect(
    async () => {
      if (id) await restoreArticle(id)
      await writeAudit({
        admin,
        action: "article_restore",
        entityType: "article",
        entityId: id,
        summary: `Восстановлена статья #${id}`,
      })
      revalidatePath("/admin/articles")
      revalidatePath("/admin/archive")
      revalidatePath("/helpful")
    },
    "/admin/archive?notice=restored",
    "/admin/archive",
  )
}

export async function purgeArticleAction(formData: FormData) {
  const admin = await requireCapability("purge")
  const id = Number(formData.get("id") || 0)
  return mutateThenRedirect(
    async () => {
      if (id) await purgeArticle(id)
      await writeAudit({
        admin,
        action: "article_purge",
        entityType: "article",
        entityId: id,
        summary: `Удалена статья #${id}`,
      })
      revalidatePath("/admin/articles")
      revalidatePath("/admin/archive")
      revalidatePath("/helpful")
    },
    "/admin/archive?notice=purged",
    "/admin/archive",
  )
}

/* ---------------- Leads ---------------- */

export async function updateLeadStatusAction(formData: FormData) {
  const admin = await requireAdmin()
  const id = Number(formData.get("id") || 0)
  const status = String(formData.get("status") || "new") as Lead["status"]
  if (id) await updateLeadStatus(id, status)
  await writeAudit({
    admin,
    action: "lead_status_update",
    entityType: "lead",
    entityId: id,
    summary: `Статус заявки #${id}: ${status}`,
    after: { status },
  })
  revalidatePath("/admin/leads")
  revalidatePath("/admin")
}

export async function deleteLeadAction(formData: FormData) {
  const admin = await requireAdmin()
  const id = Number(formData.get("id") || 0)
  return mutateThenRedirect(
    async () => {
      if (id) await deleteLead(id)
      await writeAudit({
        admin,
        action: "lead_archive",
        entityType: "lead",
        entityId: id,
        summary: `В архив заявка #${id}`,
      })
      revalidatePath("/admin/leads")
      revalidatePath("/admin/archive")
      revalidatePath("/admin")
    },
    "/admin/leads?notice=archived",
    "/admin/leads",
  )
}

export async function restoreLeadAction(formData: FormData) {
  const admin = await requireAdmin()
  const id = Number(formData.get("id") || 0)
  return mutateThenRedirect(
    async () => {
      if (id) await restoreLead(id)
      await writeAudit({
        admin,
        action: "lead_restore",
        entityType: "lead",
        entityId: id,
        summary: `Восстановлена заявка #${id}`,
      })
      revalidatePath("/admin/leads")
      revalidatePath("/admin/archive")
      revalidatePath("/admin")
    },
    "/admin/archive?notice=restored",
    "/admin/archive",
  )
}

export async function purgeLeadAction(formData: FormData) {
  const admin = await requireCapability("purge")
  const id = Number(formData.get("id") || 0)
  return mutateThenRedirect(
    async () => {
      if (id) await purgeLead(id)
      await writeAudit({
        admin,
        action: "lead_purge",
        entityType: "lead",
        entityId: id,
        summary: `Удалена заявка #${id}`,
      })
      revalidatePath("/admin/leads")
      revalidatePath("/admin/archive")
      revalidatePath("/admin")
    },
    "/admin/archive?notice=purged",
    "/admin/archive",
  )
}
