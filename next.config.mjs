/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep runtime-only server packages out of the webpack graph.
  serverExternalPackages: [
    "sharp",
    "pg",
  ],
  experimental: {
    cpus: 1,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // SAMEORIGIN (не DENY): предпросмотр страниц в админке рендерит сайт
          // в <iframe> с того же origin. Защита от clickjacking с чужих сайтов
          // сохраняется — фреймить могут только страницы самого сайта.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // 'unsafe-eval' вынужденно включён и в production: tourvisor core.min.js
              // использует eval при загрузке модулей (TV.loadModules). Без него
              // поисковый виджет туров не работает.
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://mc.yandex.ru https://mc.yandex.by https://yastatic.net https://cdn.jsdelivr.net https://tourvisor.ru https://*.tourvisor.ru",
              "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com https://tourvisor.ru https://*.tourvisor.ru",
              // Только https: mixed content (http-картинки) запрещён — браузеры
              // и так блокируют его на https-сайте, теперь это явно в политике.
              "img-src 'self' data: blob: https:",
              "font-src 'self' https://fonts.gstatic.com https://tourvisor.ru https://*.tourvisor.ru",
              "connect-src 'self' https://www.google.com https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://connect.facebook.net https://www.facebook.com https://mc.yandex.ru https://mc.yandex.by https://api.resend.com https://tourvisor.ru https://*.tourvisor.ru",
              "frame-src 'self' https://www.google.com https://www.youtube.com https://www.youtube-nocookie.com https://mc.yandex.ru https://mc.yandex.by https://yandex.ru https://*.yandex.ru https://yandex.by https://*.yandex.by https://tourvisor.ru https://*.tourvisor.ru",
              // 'self' (не 'none'): iframe-предпросмотр в админке — same-origin.
              "frame-ancestors 'self'",
              "form-action 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "report-uri /api/csp-violation",
            ].join("; "),
          },
          {
            key: "Report-To",
            value: JSON.stringify({
              group: "csp-endpoint",
              max_age: 10886400,
              endpoints: [{ url: "/api/csp-violation" }],
            }),
          },
        ],
      },
    ];
  },
  // gzip отдаёт nginx (см. ops/nginx/bastur.conf) — не тратим CPU node-процесса.
  compress: false,
  images: {
    // Оптимизация включена: sharp установлен, на VPS (pm2 + next start)
    // ресайз и конвертация в AVIF/WebP работают из коробки.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Оптимизированные версии кешируются на диске (.next/cache/images) на 31 день.
    minimumCacheTTL: 2678400,
    // Раньше стоял hostname: "**" — это открытый image-proxy: любой мог гонять
    // чужой трафик и CPU оптимизатора через /_next/image?url=... Сужаем до
    // хостов, которые реально встречаются в контенте. Новый внешний источник
    // картинок в админке = добавить хост сюда.
    remotePatterns: [
      { protocol: "https", hostname: "img.youtube.com" },       // постеры YouTube-видео (lib/video-url.ts)
      { protocol: "https", hostname: "i.ytimg.com" },           // альтернативный CDN постеров YouTube
      { protocol: "https", hostname: "images.unsplash.com" },   // seed-контент (lib/db/init.ts)
      { protocol: "https", hostname: "**.holiday.by" },         // импорт отзывов holiday.by
      { protocol: "https", hostname: "bastur.by" },
      { protocol: "https", hostname: "**.bastur.by" },
      { protocol: "https", hostname: "bus-tour.by" },           // будущий боевой домен
      { protocol: "https", hostname: "**.bus-tour.by" },
      { protocol: "https", hostname: "bus-tour.by" },       // текущий прод-домен
    ],
  },
  async redirects() {
    return [
      // Раздел «Полезная информация» переехал: /info/* → /helpful/* (301, 1:1).
      // :path* покрывает все вложенные URL — статьи, трансферы, memos, dictionary.
      { source: "/info", destination: "/helpful", permanent: true },
      { source: "/info/:path*", destination: "/helpful/:path*", permanent: true },
      // Old country pages under /tours/[category]/country/[slug]
      // (must come before the generic /tours/... rules below)
      { source: "/tours/bus/country/:slug", destination: "/avtobusnye-tury/:slug/", permanent: true },
      { source: "/tours/avia/country/:slug", destination: "/aviatory/:slug/", permanent: true },
      { source: "/tours/hot/country/:slug", destination: "/hot/:slug/", permanent: true },
      { source: "/aviatory/:countrySlug/:citySlug/:tourSlug", destination: "/avtobusnye-tury/:countrySlug/:citySlug/:tourSlug/", permanent: true },
      { source: "/hot/:countrySlug/:citySlug/:tourSlug", destination: "/avtobusnye-tury/:countrySlug/:citySlug/:tourSlug/", permanent: true },
      // Old category listing pages > new canonical URLs (301 permanent)
      { source: "/tours/bus", destination: "/avtobusnye-tury/", permanent: true },
      { source: "/tours/avia", destination: "/aviatory/", permanent: true },
      { source: "/tours/hot", destination: "/hot/", permanent: true },
      { source: "/hot-tours", destination: "/hot/", permanent: true },
      { source: "/hot-tours/:slug*", destination: "/hot/:slug*", permanent: true },
      { source: "/avia-tours", destination: "/aviatory/", permanent: true },
      { source: "/avia-tours/:slug*", destination: "/aviatory/:slug*", permanent: true },
      { source: "/bus-tours", destination: "/avtobusnye-tury/", permanent: true },
      { source: "/bus-tours/:slug*", destination: "/avtobusnye-tury/:slug*", permanent: true },
      { source: "/company/reviews", destination: "/testimonials", permanent: true },
      { source: "/company/documents", destination: "/company/licenses", permanent: true },
      { source: "/privacy", destination: "/legal/privacy", permanent: true },
      { source: "/privacy-policy", destination: "/legal/privacy", permanent: true },
      { source: "/tours/all", destination: "/avtobusnye-tury/", permanent: true },
      { source: "/tours/bus/:city", destination: "/avtobusnye-tury/", permanent: true },
      { source: "/tours/avia/:city", destination: "/aviatory/", permanent: true },
      { source: "/tours/hot/:city", destination: "/hot/", permanent: true },
    ];
  },
};

export default nextConfig;
