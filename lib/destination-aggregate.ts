import { db, type DbExecutor } from "@/lib/db"
import { ensureDb } from "@/lib/db/init"
import { createCity, updateCity, type CityInput } from "@/lib/cities"
import { createCountry, updateCountry, type CountryInput } from "@/lib/countries"
import { replacePageFaqs, saveSettings } from "@/lib/cms"
import { rekeyPageScopedContent } from "@/lib/page-rekey"
import type { NamespacedFaq } from "@/lib/faq-form"

type Aggregate = {
  id?: number
  oldPageKey?: string
  settings: Record<string, string>
  /**
   * Legacy-FAQ из главной формы. `undefined` = в форме не было faq-полей —
   * FAQ по умолчанию НЕ трогаем. Раньше сюда всегда попадал результат
   * parseFaqGroups(formData) главной формы (всегда []), и любое сохранение
   * без dirty FAQ-редактора стирало FAQ страницы.
   */
  faqs?: Parameters<typeof replacePageFaqs>[1]
  faqsByStorage?: NamespacedFaq[]
}

async function applyNamespacedFaqs(namespaced: NamespacedFaq[] | undefined, defaultPageKey: string, defaultFaqs: Parameters<typeof replacePageFaqs>[1] | undefined, tx: DbExecutor) {
  const seenStorages = new Set<string>()
  if (namespaced && namespaced.length) {
    for (const entry of namespaced) {
      seenStorages.add(entry.storage)
      await replacePageFaqs(entry.storage, entry.groups, tx)
    }
  }
  // Fallback только для legacy-форм, где faq-поля лежат в главной форме.
  // Если faq-полей в форме не было (defaultFaqs === undefined) — не трогаем.
  if (defaultFaqs !== undefined && !seenStorages.has(defaultPageKey)) {
    await replacePageFaqs(defaultPageKey, defaultFaqs, tx)
  }
}

export async function saveCountryAggregate(input: CountryInput, aggregate: Aggregate) {
  await ensureDb()
  return db.transaction(async (tx) => {
    const pageKey = `country:${input.category}:${input.slug}`
    if (aggregate.oldPageKey) await rekeyPageScopedContent(aggregate.oldPageKey, pageKey, tx)
    const id = aggregate.id ? (await updateCountry(aggregate.id, input, tx), aggregate.id) : await createCountry(input, tx)
    await saveSettings(aggregate.settings, tx)
    await applyNamespacedFaqs(aggregate.faqsByStorage, pageKey, aggregate.faqs, tx)
    return id
  })
}

export async function saveCityAggregate(input: CityInput, aggregate: Aggregate) {
  await ensureDb()
  return db.transaction(async (tx) => {
    const pageKey = `city:${input.category}:${input.slug}`
    if (aggregate.oldPageKey) await rekeyPageScopedContent(aggregate.oldPageKey, pageKey, tx)
    const id = aggregate.id ? (await updateCity(aggregate.id, input, tx), aggregate.id) : await createCity(input, tx)
    await saveSettings(aggregate.settings, tx)
    await applyNamespacedFaqs(aggregate.faqsByStorage, pageKey, aggregate.faqs, tx)
    return id
  })
}
