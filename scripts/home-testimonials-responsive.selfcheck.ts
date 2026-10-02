import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const source = readFileSync(join(process.cwd(), "components/site/testimonials.tsx"), "utf8")
const videoCard = readFileSync(join(process.cwd(), "components/site/video-card.tsx"), "utf8")

assert.match(source, /sm:grid-cols-2 lg:grid-cols-3/, "desktop/tablet responsive grid")
// Один DOM-список для мобайла и десктопа (без дубля первого отзыва в HTML):
// видимость карточки переключают классы, на мобайле показан один отзыв.
assert.match(source, /function cardVisibility\(index: number\)/, "single list, visibility by classes")
assert.match(source, /const onMobile = index === mobilePage/, "mobile renders one review")
assert.match(source, /if \(onMobile\) return "sm:hidden"/, "mobile-only card hidden from sm+")
assert.match(source, /if \(onDesktop\) return "hidden sm:block"/, "desktop-only card hidden below sm")
assert.match(source, /aria-live="polite"/, "mobile pagination announces current page")
assert.match(source, /h-11 w-11/, "mobile pagination controls have 44px touch targets")
assert.match(source, /VideoCard/, "home uses shared VideoCard")
assert.match(videoCard, /aspect-\[2\/1\]/, "video cards match 448x224 reference ratio")

console.log("home-testimonials-responsive.selfcheck: ok")
