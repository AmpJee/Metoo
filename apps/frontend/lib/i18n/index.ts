import { DICTIONARIES, type MessageKey } from './dictionaries'

export type Locale = keyof typeof DICTIONARIES

export const LOCALES = Object.keys(DICTIONARIES) as Locale[]

/**
 * Thai is the default.
 *
 * The market is Thai minimart owners; English is the second language here, not
 * the first. A shopkeeper who never touches the toggle should still see Thai.
 */
export const DEFAULT_LOCALE: Locale = 'th'

export const LOCALE_COOKIE = 'metoo_locale'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as string[]).includes(value)
}

/**
 * Look up a message, filling in `{name}` placeholders.
 *
 * Falls back to the key itself rather than to English. A visible
 * "orders.title" is a bug someone fixes; a silent English string in a Thai
 * interface is one that ships.
 */
export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>
): string {
  const message: string = DICTIONARIES[locale][key] ?? key
  if (!vars) return message

  return message.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole
  )
}

/** A bound translator, so call sites read `t('orders.title')`. */
export function translator(locale: Locale) {
  return (key: MessageKey, vars?: Record<string, string | number>) =>
    translate(locale, key, vars)
}

export type Translate = ReturnType<typeof translator>
export type { MessageKey }
