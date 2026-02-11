export type Locale = 'en' | 'da'

const STORAGE_KEY = 'yo.travianLanding.locale'

export function loadLocale(): Locale {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === 'en' || raw === 'da') return raw
  return 'en'
}

export function saveLocale(locale: Locale): void {
  localStorage.setItem(STORAGE_KEY, locale)
}
