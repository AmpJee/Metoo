'use client'

import { createContext, useContext, useMemo } from 'react'
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

/**
 * `const t = useT()` in any client component.
 *
 * Memoised on the locale, so the identity is stable between renders. That
 * matters to any component that puts `t` in a dependency array: this used to
 * hand back a fresh function every render, which made a `useMemo` keyed on it
 * recompute every time — the hero's typing animation reset itself on each
 * render and never got past the first character.
 */
export function useT() {
  const locale = useContext(LocaleContext)
  return useMemo(() => translator(locale), [locale])
}

export function useLocale() {
  return useContext(LocaleContext)
}
