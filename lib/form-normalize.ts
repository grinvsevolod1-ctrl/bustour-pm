// Жёсткое приведение введённых в формы данных к нормальному виду.
// Вызывается на blur полей во всех формах обратной связи (заявки, отзыв,
// аренда). Телефон нормализуется отдельно в lib/lead.ts (formatPhoneIfComplete),
// потому что у него своя доменная логика BY/RU.

/**
 * Имя/ФИО → «Иванов Иван».
 * Убирает всё, кроме букв, пробелов, дефиса и апострофа; схлопывает пробелы;
 * приводит регистр (в т.ч. чинит CAPS LOCK «ИВАН» → «Иван» и «иван» → «Иван»),
 * делая заглавной первую букву каждого слова, включая части через дефис/апостроф.
 */
export function normalizeName(value: string): string {
  const cleaned = value
    .replace(/[^\p{L}\s'’-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("ru-RU")
  return cleaned.replace(
    /(^|[\s'’-])(\p{L})/gu,
    (_m, sep: string, ch: string) => sep + ch.toLocaleUpperCase("ru-RU"),
  )
}

/**
 * E-mail → нижний регистр без пробелов.
 * Пользователи часто вводят «  Ivan@Mail.RU » с автозаглавной на телефоне.
 */
export function normalizeEmail(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase()
}

/**
 * Однострочные поля (дата, короткий ответ): trim + схлопывание пробелов.
 * Не трогаем содержимое по смыслу — дата может быть текстом («в выходные»).
 */
export function normalizeSingleLine(value: string): string {
  return value.replace(/[ \t]+/g, " ").trim()
}

/**
 * Многострочные поля (сообщение, комментарий, текст отзыва):
 * схлопывает пробелы/табы, срезает пробелы вокруг переносов и в конце строк,
 * ограничивает подряд идущие пустые строки до одной, обрезает края.
 */
export function normalizeMultiline(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+$/gm, "")
    .trim()
}
