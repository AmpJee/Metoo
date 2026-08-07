'use client'

import { createContext, useContext } from 'react'
import { DEFAULT_LOCALE, translator, type Locale } from '@/lib/i18n'

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE)

/**
 * Carries the locale to client components.
 *
 * Only the locale crosses the boundary, not the dictionary — both dictionaries
 * are already in the client bundle, and serialising one per page would send
 * the same few kilobytes on every navigation for no gain.
 */
export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  )
}

/** `const t = useT()` in any client component. */
export function useT() {
  return translator(useContext(LocaleContext))
}

export function useLocale() {
  return useContext(LocaleContext)
}
