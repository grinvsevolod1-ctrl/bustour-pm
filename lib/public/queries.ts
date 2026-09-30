/**
 * Кешируемые варианты запросов для ПУБЛИЧНОГО сайта.
 *
 * Админка импортирует "@/lib/queries" напрямую и всегда читает свежие данные;
 * сайт (app/(site), components/site) — этот модуль. Явные экспорты ниже
 * перекрывают одноимённые из `export *`; всё остальное (мутации, preview-выборки
 * по id для черновиков, типы) проходит как есть, без кеша.
 */
export * from "@/lib/queries"

import * as q from "@/lib/queries"
import { cachedPublicQuery } from "@/lib/site-data-cache"

export const getSlugMaps = cachedPublicQuery("slug-maps", q.getSlugMaps)

export const getTours = cachedPublicQuery("tours", q.getTours)
export const getVisibleTours = cachedPublicQuery("visible-tours", q.getVisibleTours)
export const getHomeTourOffers = cachedPublicQuery("home-tour-offers", q.getHomeTourOffers)
export const getBusToursWithDates = cachedPublicQuery("bus-tours-with-dates", q.getBusToursWithDates)
export const getTour = cachedPublicQuery("tour", q.getTour)
export const getRelatedTours = cachedPublicQuery("related-tours", q.getRelatedTours)

export const getApprovedReviews = cachedPublicQuery("approved-reviews", q.getApprovedReviews)
export const getReviewsByTour = cachedPublicQuery("reviews-by-tour", q.getReviewsByTour)

export const getArticles = cachedPublicQuery("articles", q.getArticles)
export const getArticle = cachedPublicQuery("article", q.getArticle)

export const getBuses = cachedPublicQuery("buses", q.getBuses)
export const getBus = cachedPublicQuery("bus", q.getBus)

export const getTransfers = cachedPublicQuery("transfers", q.getTransfers)
export const getTransfer = cachedPublicQuery("transfer", q.getTransfer)
export const getTransferSchedules = cachedPublicQuery("transfer-schedules", q.getTransferSchedules)

export const getStaff = cachedPublicQuery("staff", q.getStaff)
export const getCertSectionsWithItems = cachedPublicQuery("cert-sections", q.getCertSectionsWithItems)
