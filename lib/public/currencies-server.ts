/** Кешируемый getCurrencies для публичного сайта (см. lib/public/queries.ts). */
export * from "@/lib/currencies-server"

import * as src from "@/lib/currencies-server"
import { cachedPublicQuery } from "@/lib/site-data-cache"

// Авто-обновление курсов НБРБ идёт из instrumentation (вне request-scope),
// там сброс тега недоступен — новые курсы доедут на сайт по TTL (5 минут).
export const getCurrencies = cachedPublicQuery("currencies", src.getCurrencies)
