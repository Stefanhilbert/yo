import type { Locale } from '../lib/locale.ts'
import { en } from './en.ts'
import { da } from './da.ts'
import { useLocale } from '../components/LocaleProvider.tsx'

const messages: Record<Locale, Record<string, unknown>> = { en: en as Record<string, unknown>, da: da as Record<string, unknown> }

function get(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : undefined
}

export function useTranslation() {
  const { locale, setLocale } = useLocale()
  const dict = messages[locale] as Record<string, unknown>

  function t(key: string): string {
    const value = get(dict as Record<string, unknown>, key)
    return value ?? key
  }

  return { t, locale, setLocale }
}

export { en, da }
