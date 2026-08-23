// Мини-SVG-мокапы секций для пикера «Добавить секцию».
// Поиск: полный ключ → короткий ключ (последний сегмент после ".section.").
// Вынесены из page-sections-manager.tsx — это статичные данные, а не логика.

import { toShortSectionKey } from "./draft-store"

const MOCKUPS: Record<string, React.ReactNode> = {
  "egipet.section.why": (
    <svg viewBox="0 0 120 70" className="w-full" aria-hidden>
      <rect x="8" y="6" width="60" height="5" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="8" y="16" width="104" height="3" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="8" y="22" width="88" height="3" rx="1" fill="currentColor" opacity="0.2" />
      {[30,37,44,51].map((y) => (
        <g key={y}>
          <circle cx="11" cy={y+1.5} r="2" fill="currentColor" opacity="0.5" />
          <rect x="16" y={y} width="72" height="3" rx="1" fill="currentColor" opacity="0.2" />
        </g>
      ))}
      <rect x="8" y="60" width="104" height="6" rx="2" fill="currentColor" opacity="0.12" />
    </svg>
  ),
  "egipet.section.resorts": (
    <svg viewBox="0 0 120 70" className="w-full" aria-hidden>
      <rect x="8" y="6" width="55" height="5" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="8" y="16" width="104" height="3" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="8" y="22" width="90" height="3" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="8" y="44" width="50" height="22" rx="2" fill="currentColor" opacity="0.12" />
      <rect x="62" y="44" width="50" height="22" rx="2" fill="currentColor" opacity="0.12" />
    </svg>
  ),
  "egipet.section.when": (
    <svg viewBox="0 0 120 70" className="w-full" aria-hidden>
      <rect x="8" y="6" width="50" height="5" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="8" y="16" width="104" height="3" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="8" y="22" width="96" height="3" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="8" y="28" width="60" height="3" rx="1" fill="currentColor" opacity="0.2" />
    </svg>
  ),
  "egipet.section.included": (
    <svg viewBox="0 0 120 70" className="w-full" aria-hidden>
      <rect x="8" y="6" width="58" height="5" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="8" y="16" width="90" height="3" rx="1" fill="currentColor" opacity="0.2" />
      {[24,31,38,45,52,59].map((y) => (
        <g key={y}>
          <circle cx="11" cy={y+1.5} r="2" fill="currentColor" opacity="0.5" />
          <rect x="16" y={y} width="68" height="3" rx="1" fill="currentColor" opacity="0.2" />
        </g>
      ))}
    </svg>
  ),
  "egipet.section.how": (
    <svg viewBox="0 0 120 70" className="w-full" aria-hidden>
      <rect x="8" y="6" width="44" height="5" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="8" y="16" width="104" height="3" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="8" y="22" width="88" height="3" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="8" y="28" width="72" height="3" rx="1" fill="currentColor" opacity="0.2" />
    </svg>
  ),
  "egipet.section.cities": (
    <svg viewBox="0 0 120 70" className="w-full" aria-hidden>
      <rect x="8" y="6" width="52" height="5" rx="2" fill="currentColor" opacity="0.5" />
      {[[8,16],[44,16],[80,16],[8,34],[44,34],[80,34]].map(([x,y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="32" height="14" rx="2" fill="currentColor" opacity="0.15" />
      ))}
    </svg>
  ),
  "egipet.section.compare": (
    <svg viewBox="0 0 120 70" className="w-full" aria-hidden>
      <rect x="8" y="6" width="56" height="5" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="8" y="16" width="104" height="8" rx="2" fill="currentColor" opacity="0.35" />
      {[28,39,50,61].map((y,i) => (
        <rect key={y} x="8" y={y} width="104" height="8" rx="1" fill="currentColor" opacity={i%2===0 ? 0.1 : 0.05} />
      ))}
    </svg>
  ),
  "egipet.section.season": (
    <svg viewBox="0 0 120 70" className="w-full" aria-hidden>
      <rect x="8" y="6" width="48" height="5" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="8" y="16" width="104" height="3" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="8" y="22" width="96" height="3" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="8" y="38" width="104" height="3" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="8" y="44" width="88" height="3" rx="1" fill="currentColor" opacity="0.2" />
    </svg>
  ),
  /* SEO-текст (расширенный) — блоки rich-редактора */
  "egipet.section.seo": (
    <svg viewBox="0 0 120 70" className="w-full" aria-hidden>
      <rect x="8" y="6" width="70" height="5" rx="2" fill="currentColor" opacity="0.5" />
      {/* Полоса тулбара */}
      <rect x="8" y="16" width="104" height="8" rx="2" fill="currentColor" opacity="0.12" />
      {[4,4,4,4,4].map((_, i) => (
        <rect key={i} x={12 + i * 10} y="18" width="6" height="4" rx="1" fill="currentColor" opacity="0.3" />
      ))}
      {/* Тело текста */}
      <rect x="8" y="28" width="104" height="3" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="8" y="34" width="96" height="3" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="8" y="40" width="100" height="3" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="8" y="46" width="80" height="3" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="8" y="52" width="104" height="3" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="8" y="58" width="72" height="3" rx="1" fill="currentColor" opacity="0.2" />
    </svg>
  ),
  /* Частые вопросы — строки аккордеона */
  "egipet.section.faq": (
    <svg viewBox="0 0 120 70" className="w-full" aria-hidden>
      <rect x="8" y="6" width="56" height="5" rx="2" fill="currentColor" opacity="0.5" />
      {[18, 31, 44, 57].map((y) => (
        <g key={y}>
          <rect x="8" y={y} width="104" height="9" rx="2" fill="currentColor" opacity="0.1" />
          <rect x="12" y={y + 3} width="72" height="3" rx="1" fill="currentColor" opacity="0.3" />
          {/* индикатор-шеврон */}
          <rect x="104" y={y + 3} width="5" height="3" rx="1" fill="currentColor" opacity="0.25" />
        </g>
      ))}
    </svg>
  ),
  /* Алерт страницы — цветная плашка */
  "egipet.section.alert": (
    <svg viewBox="0 0 120 70" className="w-full" aria-hidden>
      <rect x="8" y="6" width="52" height="5" rx="2" fill="currentColor" opacity="0.5" />
      {/* Плашка алерта */}
      <rect x="8" y="20" width="104" height="22" rx="3" fill="currentColor" opacity="0.15" />
      <rect x="14" y="26" width="6" height="10" rx="2" fill="currentColor" opacity="0.4" />
      <rect x="26" y="27" width="72" height="3" rx="1" fill="currentColor" opacity="0.35" />
      <rect x="26" y="33" width="54" height="3" rx="1" fill="currentColor" opacity="0.2" />
    </svg>
  ),
  /* Универсальные алиасы по коротким ключам — когда pageKey != "egipet" */
  "cities": (
    <svg viewBox="0 0 120 70" className="w-full" aria-hidden>
      <rect x="8" y="6" width="52" height="5" rx="2" fill="currentColor" opacity="0.5" />
      {[[8,16],[44,16],[80,16],[8,34],[44,34],[80,34]].map(([x,y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="32" height="14" rx="2" fill="currentColor" opacity="0.15" />
      ))}
    </svg>
  ),
  "seo": (
    <svg viewBox="0 0 120 70" className="w-full" aria-hidden>
      <rect x="8" y="6" width="70" height="5" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="8" y="16" width="104" height="8" rx="2" fill="currentColor" opacity="0.12" />
      {[0,1,2,3,4].map((i) => (
        <rect key={i} x={12 + i * 10} y="18" width="6" height="4" rx="1" fill="currentColor" opacity="0.3" />
      ))}
      <rect x="8" y="28" width="104" height="3" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="8" y="34" width="96" height="3" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="8" y="40" width="100" height="3" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="8" y="46" width="80" height="3" rx="1" fill="currentColor" opacity="0.2" />
    </svg>
  ),
  "resorts": (
    <svg viewBox="0 0 120 70" className="w-full" aria-hidden>
      <rect x="8" y="6" width="56" height="5" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="8" y="16" width="104" height="8" rx="2" fill="currentColor" opacity="0.35" />
      {[28,39,50,61].map((y,i) => (
        <rect key={y} x="8" y={y} width="104" height="8" rx="1" fill="currentColor" opacity={i%2===0 ? 0.1 : 0.05} />
      ))}
    </svg>
  ),
  "faq": (
    <svg viewBox="0 0 120 70" className="w-full" aria-hidden>
      <rect x="8" y="6" width="56" height="5" rx="2" fill="currentColor" opacity="0.5" />
      {[18, 31, 44, 57].map((y) => (
        <g key={y}>
          <rect x="8" y={y} width="104" height="9" rx="2" fill="currentColor" opacity="0.1" />
          <rect x="12" y={y + 3} width="72" height="3" rx="1" fill="currentColor" opacity="0.3" />
          <rect x="104" y={y + 3} width="5" height="3" rx="1" fill="currentColor" opacity="0.25" />
        </g>
      ))}
    </svg>
  ),
  "callus": (
    <svg viewBox="0 0 120 70" className="w-full" aria-hidden>
      <rect x="8" y="16" width="104" height="38" rx="3" fill="currentColor" opacity="0.1" />
      <rect x="22" y="24" width="76" height="5" rx="2" fill="currentColor" opacity="0.4" />
      <rect x="30" y="32" width="60" height="3" rx="1" fill="currentColor" opacity="0.25" />
      <rect x="38" y="43" width="44" height="8" rx="3" fill="currentColor" opacity="0.35" />
    </svg>
  ),
}

export function getMockup(fullKey: string): React.ReactNode | undefined {
  if (MOCKUPS[fullKey]) return MOCKUPS[fullKey]
  const shortKey = toShortSectionKey(fullKey).replace(/\d+$/, "") // seo2 → seo
  return shortKey ? MOCKUPS[shortKey] : undefined
}

export function DefaultMockup({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 120 70" className="w-full" aria-hidden>
      <rect x="8" y="6" width="50" height="5" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="8" y="16" width="104" height="3" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="8" y="22" width="88" height="3" rx="1" fill="currentColor" opacity="0.2" />
      <text x="8" y="60" fontSize="8" fill="currentColor" opacity="0.4">{label}</text>
    </svg>
  )
}
