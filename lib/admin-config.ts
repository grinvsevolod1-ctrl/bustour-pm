import { ALERT_KIND_OPTIONS } from "@/lib/alert-kind"
import type { SettingsGroup, PageSection } from "@/lib/admin-config-types"
import {
  pageAlertFields,
  seoPreviewDescriptionFields,
  pageHeaderGroup,
} from "@/lib/admin-config-fields"

/**
 * Фасад конфигурации админки. После разбиения здесь остались только
 * статические группы настроек (pageSettingsGroups, settingsGroups и пр.);
 * типы живут в admin-config-types.ts, DRY-хелперы полей —
 * в admin-config-fields.ts, фабрики динамических страниц —
 * в admin-page-configs.ts. Реэкспорты внизу сохраняют обратную
 * совместимость всех существующих импортов из "@/lib/admin-config".
 */

/* Page-specific settings, each accessible from /admin/pages/[slug] */
export const pageSettingsGroups: Record<string, {
  heading: string
  url: string
  groups: SettingsGroup[]
  /** Optional per-section visibility toggles (shown on the page editor as on/off) */
  sections?: PageSection[]
}> = {
  home: {
    heading: "Главная страница",
    url: "/",
    groups: [
      {
        heading: "SEO и мета",
        fields: [
          { key: "home.metaTitle", label: "Title (SEO)", type: "shortcode-input" },
          ...seoPreviewDescriptionFields("home"),
          { key: "home.metaImage", label: "Превью изображение", type: "media" },
        ],
      },
      {
        heading: "Заголовки секций",
        fields: [
          { key: "title.search", label: "Поиск туров — заголовок", type: "shortcode-input" },
          {
            key: "description.search",
            label: "Поиск туров — описание под заголовком",
            type: "shortcode-textarea-multiline",
            rows: 2,
            hint: "Пара предложений, чтобы посетитель понял: как работает поиск (показывается над фильтром на главной).",
          },
          { key: "title.featured", label: "Лучшие предложения — заголовок", type: "shortcode-input" },
          {
            key: "description.featured",
            label: "Лучшие предложения — описание под заголовком",
            type: "shortcode-textarea-multiline",
            rows: 2,
            hint: "Короткий текст-интро над карточками «Лучшие предложения».",
          },
          { key: "title.advantages", label: "Преимущества — заголовок", type: "shortcode-input" },
          {
            key: "description.advantages",
            label: "Преимущества — описание под заголовком",
            type: "shortcode-textarea-multiline",
            rows: 2,
            hint: "Короткий текст-интро над иконками преимуществ.",
          },
          { key: "title.faq", label: "Частые вопросы — заголовок", type: "shortcode-input" },
          {
            key: "description.faq",
            label: "Частые вопросы — описание под заголовком",
            type: "shortcode-textarea-multiline",
            rows: 2,
            hint: "Короткое вступление над блоком FAQ.",
          },
          { key: "title.testimonials", label: "Отзывы — заголовок", type: "shortcode-input" },
          {
            key: "description.testimonials",
            label: "Отзывы — описание под заголовком",
            type: "shortcode-textarea-multiline",
            rows: 2,
            hint: "Короткое вступление над блоком отзывов (отдельно от подзаголовка слева внутри блока).",
          },
          { key: "title.placement", label: "Наше расположение — заголовок", type: "shortcode-input" },
          {
            key: "description.placement",
            label: "Наше расположение — описание под заголовком",
            type: "shortcode-textarea-multiline",
            rows: 2,
            hint: "Короткое вступление над картой/адресом офиса.",
          },
        ],
      },
      {
        heading: "Блок отзывов (главная)",
        fields: [
          {
            key: "testimonials.infoTitle",
            label: "Отзывы — подзаголовок карточки",
            type: "shortcode-input",
            hint: "Крупный текст слева в блоке видеоотзывов",
          },
          {
            key: "testimonials.infoBody",
            label: "Отзывы — текст под подзаголовком",
            type: "shortcode-textarea-multiline",
            rows: 3,
          },
          {
            key: "testimonials.homeCta",
            label: "Отзывы — текст кнопки «Все отзывы»",
            type: "shortcode-input",
            defaultValue: "Все отзывы",
          },
        ],
      },
      {
        heading: "Фильтр туров",
        fields: [
          {
            key: "tours.currencies",
            label: "Валюты фильтра",
            hint: "Через запятую, например BYN,USD,EUR. Первая — по умолчанию.",
          },
        ],
      },
    ],
  },
  staff: {
    heading: "Сотрудники",
    url: "/company/staff",
    groups: [
      {
        heading: "SEO и мета",
        fields: [
          { key: "staff.metaTitle", label: "Title (SEO)", type: "shortcode-input" },
          ...seoPreviewDescriptionFields("staff"),
          { key: "staff.metaImage", label: "Превью изображение", type: "media" },
        ],
      },
      {
        heading: "Тексты страницы",
        fields: [
          { key: "staff.title", label: "Заголовок страницы (H1)", type: "shortcode-input" },
          { key: "staff.intro", label: "Вводный текст под заголовком", type: "richtext" },
        ],
      },
    ],
  },
  licenses: {
    heading: "Лицензии и сертификаты",
    url: "/company",
    groups: [
      {
        heading: "SEO и мета",
        fields: [
          { key: "licenses.metaTitle", label: "Title (SEO)", type: "shortcode-input" },
          ...seoPreviewDescriptionFields("licenses"),
          { key: "licenses.metaImage", label: "Превью изображение", type: "media" },
        ],
      },
      {
        heading: "Тексты страницы",
        fields: [
          { key: "licenses.title", label: "Заголовок страницы (H1)", type: "shortcode-input" },
          { key: "licenses.intro", label: "Вводный текст под заголовком", type: "richtext" },
        ],
      },
    ],
  },
  reviews: {
    heading: "Страница «Отзывы»",
    url: "/testimonials",
    groups: [
      {
        heading: "SEO и мета",
        fields: [
          { key: "reviews.metaTitle", label: "Title (SEO)", type: "shortcode-input" },
          ...seoPreviewDescriptionFields("reviews"),
          { key: "reviews.metaImage", label: "Превью изображение", type: "media" },
        ],
      },
      {
        heading: "Тексты страницы",
        fields: [
          { key: "testimonials.pageTitle", label: "Заголовок страницы (H1)", type: "shortcode-input" },
          { key: "testimonials.pageIntro", label: "Вводный текст", type: "shortcode-textarea-multiline", rows: 3 },
          { key: "testimonials.pageButton", label: "Текст кнопки «Оставить отзыв»", type: "shortcode-input" },
          { key: "reviews.formUrl", label: "Ссылка кнопки «Оставить отзыв»" },
        ],
      },
    ],
  },
  company: {
    heading: "Страница «Компания»",
    url: "/company",
    groups: [
      {
        heading: "SEO и мета",
        fields: [
          { key: "company.metaTitle", label: "Title (SEO)", type: "shortcode-input", placeholder: "Компания — БасТур" },
          ...seoPreviewDescriptionFields("company"),
          { key: "company.metaImage", label: "Превью изображение", type: "media" },
        ],
      },
      {
        heading: "Тексты страницы",
        fields: [
          { key: "company.title", label: "Заголовок H1", type: "shortcode-input" },
          { key: "company.body", label: "Текст", type: "richtext" },
        ],
      },
    ],
  },
  rental: {
    heading: "Страница «Аренда автобусов»",
    url: "/bus-rental",
    groups: [
      {
        heading: "SEO и мета",
        fields: [
          { key: "rental.metaTitle", label: "Title (SEO)", type: "shortcode-input", placeholder: "Аренда автобусов — БасТур" },
          ...seoPreviewDescriptionFields("rental"),
          { key: "rental.metaImage", label: "Превью изображение", type: "media" },
          ...pageAlertFields("rental"),
        ],
      },
      pageHeaderGroup("rental", { titleKey: "title" }),
      {
        heading: "Блок «Наш автобусный парк»",
        fields: [
          { key: "rental.fleetTitle", label: "Заголовок блока автопарка", type: "shortcode-input", placeholder: "Наш автобусный парк" },
        ],
      },
    ],
  },
  info: {
    heading: "Страница «Полезная информация» (блог)",
    url: "/helpful",
    groups: [
      {
        heading: "SEO и мета",
        fields: [
          { key: "info.metaTitle", label: "Title (SEO)", type: "shortcode-input", placeholder: "Полезная информация — БасТур" },
          ...seoPreviewDescriptionFields("info"),
          {
            key: "info.metaKeywords",
            label: "Keywords",
            type: "shortcode-input",
            hint: "Через запятую. Попадают в meta keywords.",
          },
          { key: "info.metaImage", label: "Превью / OG изображение", type: "media" },
        ],
      },
      {
        heading: "Шапка страницы",
        fields: [
          { key: "info.title", label: "Заголовок", type: "shortcode-input", placeholder: "Полезная информация" },
          {
            key: "info.intro",
            label: "Подзаголовок / вводный текст",
            type: "richtext",
            hint: "Необязательно. Показывается под заголовком списка статей.",
          },
        ],
      },
    ],
  },
  dictionary: {
    heading: "Страница «Туристический словарь»",
    url: "/helpful/dictionary",
    groups: [
      {
        heading: "SEO и мета",
        fields: [
          { key: "dictionary.metaTitle", label: "Title (SEO)", type: "shortcode-input" },
          ...seoPreviewDescriptionFields("dictionary"),
          { key: "dictionary.metaImage", label: "Превью изображение", type: "media" },
        ],
      },
      {
        heading: "Заголовок и вводный текст",
        fields: [
          { key: "dictionary.title", label: "Заголовок страницы (H1)", type: "shortcode-input" },
          {
            key: "dictionary.intro",
            label: "Вводный текст",
            type: "richtext",
          },
        ],
      },
    ],
  },
  memos: {
    heading: "Страница «Памятка туристу»",
    url: "/helpful/memos",
    groups: [
      {
        heading: "SEO и мета",
        fields: [
          { key: "memos.metaTitle", label: "Title (SEO)", type: "shortcode-input" },
          ...seoPreviewDescriptionFields("memos"),
          {
            key: "memos.metaKeywords",
            label: "Keywords",
            type: "shortcode-input",
            hint: "Через запятую. Попадают в meta keywords.",
          },
          { key: "memos.metaImage", label: "Превью / OG изображение", type: "media" },
        ],
      },
      {
        heading: "Шапка страницы",
        fields: [
          { key: "memos.title", label: "Заголовок", type: "shortcode-input" },
          {
            key: "memos.intro",
            label: "Подзаголовок / вводный текст",
            type: "richtext",
          },
          {
            key: "memos.headerImage",
            label: "Фоновое изображение шапки",
            type: "media",
            mediaAccept: ["image"],
            hint: "Необязательно. Если пусто — шапка без фото.",
          },
        ],
      },
    ],
  },
  testimonials: {
    heading: "Страница «Отзывы»",
    url: "/testimonials",
    groups: [
      {
        heading: "Тексты страницы",
        fields: [
          { key: "testimonials.pageTitle", label: "Заголовок страницы (H1)", type: "shortcode-input" },
          { key: "testimonials.pageIntro", label: "Вводный текст", type: "shortcode-textarea-multiline", rows: 3 },
          { key: "testimonials.pageButton", label: "Текст кнопки «Оставить отзыв»", type: "shortcode-input" },
          { key: "reviews.formUrl", label: "Ссылка кнопки «Оставить отзыв»", hint: "URL формы или # если форма на этой же странице" },
        ],
      },
    ],
  },
  transfers: {
    heading: "Страница «Трансферы»",
    url: "/helpful/transfers",
    groups: [
      {
        heading: "SEO и мета",
        fields: [
          { key: "transfers.metaTitle", label: "Title (SEO)", type: "shortcode-input" },
          ...seoPreviewDescriptionFields("transfers"),
          { key: "transfers.metaImage", label: "Превью изображение", type: "media" },
        ],
      },
      {
        heading: "Тексты страницы",
        fields: [
          { key: "transfers.title", label: "Заголовок страницы (H1)", type: "shortcode-input" },
          {
            key: "transfers.intro",
            label: "Вводный текст",
            type: "richtext",
          },
          { key: "transfers.airportsTitle", label: "Заголовок блока аэропортов (H2)", type: "shortcode-input" },
          {
            key: "transfers.individualTitle",
            label: "Заголовок блока индивидуальных трансферов (H2)",
            type: "shortcode-input",
          },
          {
            key: "transfers.outro",
            label: "Нижний текстовый блок",
            type: "richtext",
          },
        ],
      },
    ],
  },
  hot: {
    heading: "Горящие туры",
    url: "/hot/",
    groups: [pageHeaderGroup("hot")],
  },
}


/** SEO for `/contacts` — keys `contacts.meta*`. */
export const contactsSeoSettingsGroup: SettingsGroup = {
  heading: "SEO и мета",
  fields: [
    { key: "contacts.metaTitle", label: "Title (SEO)", type: "shortcode-input", placeholder: "Контакты — БасТур" },
    ...seoPreviewDescriptionFields("contacts"),
    { key: "contacts.metaImage", label: "Превью изображение", type: "media" },
  ],
}

export const contactsSettingsGroup: SettingsGroup = {
  heading: "Контакты",
  description: "Отображаются в шапке, футере и на странице контактов.",
  fields: [
    { key: "site.brand", label: "Название компании", type: "shortcode-input" },
    {
      key: "site.brandNote",
      label: "Приписка под названием (в футере)",
      type: "shortcode-input",
      placeholder: "Туристическая компания",
      hint: "Мелкий текст под названием компании в футере.",
    },
    { key: "site.phone", label: "Телефон в шапке (как показывать)" },
    {
      key: "site.phones",
      label: "Телефоны в футере",
      type: "textarea",
      hint: "По одному номеру на строку. Ссылка tel: подставляется автоматически.",
    },
    {
      key: "site.emergencyPhone",
      label: "Экстренный телефон",
      hint: "Номер для срочной связи вне обычного режима работы.",
    },
    { key: "site.email", label: "E-mail" },
    { key: "site.emails", label: "E-mail адреса", type: "textarea", hint: "По одному адресу на строку." },
    { key: "site.address", label: "Адрес" },
    { key: "site.hours", label: "Часы работы" },
    { key: "site.hoursNote", label: "Примечание к часам" },
    { key: "site.hoursFull", label: "Полный режим работы", type: "textarea", hint: "Дни и часы работы по одному пункту на строку." },
    {
      key: "site.routeVideo",
      label: "Видео маршрута до офиса",
      type: "media",
      mediaAccept: ["video"],
      hint: "Загрузите видеофайл или выберите видео из медиатеки.",
    },
    {
      key: "site.routeVideoPoster",
      label: "Превью видео маршрута",
      type: "media",
      mediaAccept: ["image"],
      hint: "Миниатюра до нажатия Play.",
    },
    {
      key: "site.copyright",
      label: "Строка копирайта в футере",
      type: "shortcode-input",
      hint: "Текст и годы в нижней строке футера. Например: © БасТур, 2013–2025. Копирование материалов запрещено.",
    },
  ],
}

/** Site-wide CallUs banner copy (keys `callus.*`). */
export const callusBannerSettingsGroup: SettingsGroup = {
  heading: "Баннер заказа звонка",
  description:
    "Текст баннера «Есть вопросы?» и подпись кнопки на всём сайте. Фон баннера здесь не меняется.",
  fields: [
    { key: "callus.title", label: "Заголовок баннера", type: "shortcode-input", hint: "Например: «Есть вопросы?»" },
    { key: "callus.subtitle", label: "Текст под заголовком", type: "shortcode-input" },
    { key: "callus.button", label: "Подпись кнопки", type: "shortcode-input" },
  ],
}

/** Site-wide settings page — contacts live under «Страницы → Контакты». */
export const settingsGroups: SettingsGroup[] = [
  {
    heading: "Важное сообщение (попап)",
    description:
      "Всплывающее окно при заходе на сайт — для срочных объявлений: график работы в праздники, изменения рейсов и т.п.",
    fields: [
      {
        key: "announcement.enabled",
        label: "Показывать сообщение",
        type: "select",
        defaultValue: "0",
        options: [
          { value: "1", label: "Да — попап активен" },
          { value: "0", label: "Нет — скрыт" },
        ],
      },
      {
        key: "announcement.title",
        label: "Заголовок",
        type: "shortcode-input",
        placeholder: "С Новым годом!",
      },
      {
        key: "announcement.text",
        label: "Текст сообщения",
        type: "shortcode-textarea-multiline",
        rows: 4,
        placeholder: "Мы не работаем с 31 декабря по 3 января. Заявки, оставленные на сайте, обработаем 4 января.",
        hint: "Каждая строка — отдельный абзац.",
      },
      {
        key: "announcement.type",
        label: "Тон сообщения",
        type: "select",
        defaultValue: "info",
        options: ALERT_KIND_OPTIONS,
      },
      {
        key: "announcement.startDate",
        label: "Показывать с (дата)",
        type: "date",
        hint: "Пусто — показывать сразу.",
      },
      {
        key: "announcement.endDate",
        label: "Показывать по (дата)",
        type: "date",
        hint: "Включительно. Пусто — без ограничения.",
      },
    ],
    help: "Посетитель закрывает попап один раз — повторно он не появится, пока вы не измените текст или заголовок сообщения. Изменили текст — попап покажется всем снова.",
  },
  {
    heading: "Сайт",
    description: "Основные настройки сайта.",
    fields: [
      {
        key: "site.url",
        label: "URL сайта",
        placeholder: "https://bastur.by",
        hint: "Используется в ссылках на виджет Tourvisor. Укажите полный адрес с https://",
      },
      {
        key: "site.captchaStatusVisible",
        label: "Показывать статус капчи",
        type: "select",
        defaultValue: "0",
        options: [
          { value: "1", label: "Да — «Капча: пройдена / не пройдена»" },
          { value: "0", label: "Нет" },
        ],
        hint: "Только DEV-стенд и публичные формы (не /admin). По умолчанию выключено.",
      },
    ],
  },
  callusBannerSettingsGroup,
  {
    heading: "Уведомления о заявках",
    description:
      "Куда отправлять новые заявки с сайта (бронирования, звонки, аренд��). E-mail работает через Resend (ключ RESEND_API_KEY в окружении), Telegram — через бота (TELEGRAM_BOT_TOKEN).",
    fields: [
      {
        key: "notify.emailTo",
        label: "E-mail получателей заявок",
        type: "textarea",
        rows: 2,
        placeholder: "info@bastur.by\nmanager@bastur.by",
        hint: "По одному адресу на строку (или через запятую). Пусто — использовать адрес из переменной окружения LEAD_EMAIL_TO.",
      },
      {
        key: "notify.emailFrom",
        label: "E-mail отправителя",
        placeholder: "БасТур <noreply@bastur.by>",
        hint: "Адрес должен быть подтверждён в Resend. Пусто — значение LEAD_EMAIL_FROM из окружения.",
      },
      {
        key: "notify.emailEnabled",
        label: "Отправлять на e-mail",
        type: "select",
        defaultValue: "true",
        options: [
          { value: "true", label: "Да" },
          { value: "false", label: "Нет" },
        ],
      },
      {
        key: "notify.telegramEnabled",
        label: "Отправлять в Telegram",
        type: "select",
        defaultValue: "true",
        options: [
          { value: "true", label: "Да" },
          { value: "false", label: "Нет" },
        ],
      },
      {
        key: "notify.telegramChatId",
        label: "Telegram chat ID",
        placeholder: "-1001234567890",
        hint: "ID чата или канала. Пусто — значение TELEGRAM_CHAT_ID из окружения.",
      },
    ],
    help: "Уведомления отправляются в фоне и не задерживают отправку формы. Если канал не настроен — он просто пропускается, заявка всё равно сохраняется в разделе «Заявки».",
  },
  {
    heading: "Веб-аналитика и цели",
    description: "Скрипты загружаются только после согласия посетителя на аналитические cookie.",
    fields: [
      { key: "analytics.ymCounterId", label: "Яндекс.Метрика — номер счётчика", placeholder: "12345678" },
      { key: "analytics.enableWebvisor", label: "Включить Вебвизор", type: "select", defaultValue: "true", options: [{ value: "true", label: "Да" }, { value: "false", label: "Нет" }] },
      { key: "analytics.gtmId", label: "Google Tag Manager", placeholder: "GTM-XXXXXXX" },
      { key: "analytics.gaMeasurementId", label: "Google Analytics 4", placeholder: "G-XXXXXXXXXX" },
      { key: "analytics.fbPixelId", label: "Facebook (Meta) Pixel ID", placeholder: "1234567890123456", hint: "Загружается только после согласия на маркетинговые cookie." },
      { key: "analytics.goalLeadSuccess", label: "Цель: заявка на тур", placeholder: "lead_success" },
      { key: "analytics.goalCallbackSuccess", label: "Цель: заказ звонка", placeholder: "callback_request" },
      { key: "analytics.goalReviewSuccess", label: "Цель: отправка отзыва", placeholder: "review_success" },
      { key: "analytics.successRedirectUrl", label: "Страница после успешной отправки", placeholder: "/success", hint: "Оставьте пустым, чтобы сохранить штатное сообщение и закрытие модального окна." },
    ],
    help: "Как настроить цели в Яндекс.Метрике: перейдите в Настройки счетчика -> Цели -> Добавить цель -> Тип: JavaScript-событие. В поле Идентификатор цели впишите значение, указанное выше (например, lead_success).",
  },
  {
    heading: "Карта",
    description: "Карта на главной и в контактах (URL iframe src Яндекс map-widget или другой embed).",
    fields: [
    {
      key: "site.mapEmbedUrl",
      label: "URL iframe карты",
      hint: "URL map-widget или весь <iframe …>. Полный HTML сохраняется без изменений, для показа используется src. Constructor (um=constructor) тоже ок.",
      type: "textarea",
      rows: 3,
    },
    ],
  },
]

export const sectionToggles: { key: string; label: string; hint: string }[] = [
  { key: "section.search", label: "Поиск туров", hint: "Форма поиска на главной" },
  { key: "section.featured", label: "Лучшие предложения", hint: "Сетка рекомендованных туров" },
  { key: "section.advantages", label: "Преимущества", hint: "Блок «Почему выбирают нас»" },
  { key: "section.testimonials", label: "Отзывы", hint: "Карусель отзывов" },
]

// Типы полей и реестр коллекций вынесены в lib/admin-config-types.ts.
// Реэкспорт сохраняет обратную совместимость всех существующих импортов.
export type {
  BlockField,
  CollectionMeta,
  SettingFieldOption,
  SettingField,
  SettingsGroup,
  PageSection,
} from "@/lib/admin-config-types"
export {
  collections,
  collectionListPath,
  contentHubCollections,
  getCollection,
} from "@/lib/admin-config-types"

// DRY-хелперы построения полей вынесены в lib/admin-config-fields.ts.
export {
  pageAlertFields,
  SEO_META_DESCRIPTION_LABEL,
  SEO_META_DESCRIPTION_HINT,
  SEO_META_SHORT_DESC_LABEL,
  SEO_META_SHORT_DESC_HINT,
  seoPreviewDescriptionFields,
  pageHeaderFields,
  pageHeaderGroup,
  citiesCardsFields,
  searchSectionFields,
  searchSectionGroup,
  resortsSectionFields,
} from "@/lib/admin-config-fields"

// Фабрики конфигов динамических страниц вынесены в lib/admin-page-configs.ts.
// Реэкспорт сохраняет обратную совместимость всех существующих импортов.
export {
  aviaHomePageConfig,
  aviaCountryPageGroups,
  aviaCityPageConfig,
  busPageConfig,
  transferPageConfig,
  aviaCountryPageConfig,
  hotHomePageConfig,
  busHomePageConfig,
  hotCountryPageConfig,
  hotCityPageConfig,
} from "@/lib/admin-page-configs"
