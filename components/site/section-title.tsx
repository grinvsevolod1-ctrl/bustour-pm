export function SectionTitle({ children }: { children: React.ReactNode }) {
  // Линии видны и на телефоне: раньше они прятались до sm, и h2 на мобильной
  // главной выглядел «голым» текстом, не как на десктопе. min-w-4 оставляет
  // короткий штрих даже при переносе длинного заголовка на две строки.
  return (
    <div className="flex items-center gap-3 md:gap-6">
      <span className="h-px min-w-4 flex-1 bg-line" aria-hidden />
      <h2 className="max-w-[85%] text-balance text-center text-xl font-semibold leading-snug text-ink md:max-w-none md:text-2xl">
        {children}
      </h2>
      <span className="h-px min-w-4 flex-1 bg-line" aria-hidden />
    </div>
  )
}
