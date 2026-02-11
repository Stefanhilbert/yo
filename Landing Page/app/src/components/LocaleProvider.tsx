import React from 'react'
import type { Locale } from '../lib/locale.ts'
import { loadLocale, saveLocale } from '../lib/locale.ts'

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LocaleContext = React.createContext<LocaleContextValue | undefined>(undefined)

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>(() => loadLocale())

  React.useEffect(() => {
    saveLocale(locale)
    document.documentElement.lang = locale === 'da' ? 'da' : 'en'
  }, [locale])

  const value = React.useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: setLocaleState,
    }),
    [locale],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = React.useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
