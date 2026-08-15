/** Allow only same-origin relative paths for post-login redirects. */
export function safeInternalNext(next: string | null | undefined): string | null {
  if (!next) return null
  const value = next.trim()
  // "/\evil.com" браузеры нормализуют в "//evil.com" → open redirect,
  // поэтому обратный слеш после "/" отклоняем так же, как "//".
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null
  return value
}
