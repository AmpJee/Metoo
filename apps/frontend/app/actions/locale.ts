'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { LOCALE_COOKIE, isLocale } from '@/lib/i18n'

/** A year: the language someone reads in is not a per-session preference. */
const MAX_AGE = 365 * 24 * 60 * 60

/**
 * Switch language.
 *
 * Not httpOnly — unlike the session cookies, there is nothing to protect here,
 * and leaving it readable means client code can pick up the choice without a
 * round trip. `revalidatePath('/', 'layout')` is what makes every server
 * component re-render in the new language rather than only the current page.
 */
export async function setLocale(next: string) {
  if (!isLocale(next)) return

  ;(await cookies()).set(LOCALE_COOKIE, next, {
    path: '/',
    maxAge: MAX_AGE,
    sameSite: 'lax',
  })

  revalidatePath('/', 'layout')
}
