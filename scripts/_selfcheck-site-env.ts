// Герметизация selfcheck-скриптов: lib/canonical-origin фиксирует
// CANONICAL_ORIGIN из env в момент импорта модуля, поэтому на стендах
// с другим NEXT_PUBLIC_SITE_URL (localhost, bus-tour.by) ассерты
// на https://bastur.by ломались бы. Импортируй этот модуль ПЕРВЫМ —
// до любого импорта, тянущего lib/canonical-origin.
process.env.NEXT_PUBLIC_SITE_URL = "https://bastur.by"

export {}
