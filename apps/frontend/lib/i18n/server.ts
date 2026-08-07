import 'server-only'
import { cookies } from 'next/headers'
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  translator,
  type Locale,
} from './index'

/**
 * The reader's language, from a cookie the toggle sets.
 *
 * A cookie rather than a URL segment: adding /th and /en prefixes would mean
 * rewriting every Link in the app and doubling the route table, and the
 * language is a property of the person, not of the page they are looking at.
 * The trade-off is that pages become per-request rather than cacheable, which
 * is already true here — every screen is behind a session.
 */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : DEFAULT_LOCALE
}

/** `const t = await getT()` in any server component. */
export async function getT() {
  return translator(await getLocale())
}
