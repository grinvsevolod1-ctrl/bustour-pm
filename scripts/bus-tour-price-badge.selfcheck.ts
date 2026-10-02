import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const source = readFileSync("components/site/tour-card.tsx", "utf8")

// Карточка принимает узкий TourCardData (а не весь Tour), чтобы не тянуть
// лишние поля в клиентский бандл; фолбэк по category при этом сохранён.
assert.match(source, /\(tour as (?:Tour|TourCardData) & \{ category\?: string \}\)\.category === "bus"/)
assert.match(source, /fallbackPrice\.replace\(\/\\s\+за человека\$\/, ""\)/)
assert.match(source, /effectiveIsBus \? "[^"]*items-center[^"]*justify-center[^"]*bg-\[#E84242\][^"]*text-center[^"]*text-white[^"]*\[&_\*\]:text-white[^"]*"/)
assert.match(source, /showPerPerson=\{!effectiveIsBus/)
assert.match(source, /effectiveIsBus \? "[^"]*text-white[^"]*" : "/)

console.log("bus-tour-price-badge.selfcheck: ok")
