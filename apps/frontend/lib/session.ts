import 'server-only'
import { cookies } from 'next/headers'
import { env } from './env'
import { accessCookieMaxAge } from './token-lifetime'

/**
 * Session cookies.
 *
 * Both are httpOnly, so no script in the page can read a token — this is the
 * whole reason the frontend proxies the API instead of calling it from the
 * browser with a token in localStorage.
 *
 * The access cookie's lifetime comes from the token's own `exp`, so it always
 * expires just before the token does whatever JWT_ACCESS_TTL is set to. That
 * expiry is the signal proxy.ts uses to renew.
 */

export const ACCESS_COOKIE = 'metoo_at'
export const REFRESH_COOKIE = 'metoo_rt'

// Just under the backend's 30-day refresh window.
const REFRESH_MAX_AGE = 29 * 24 * 60 * 60

const base = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
} as const

type Store = Awaited<ReturnType<typeof cookies>>

export function writeSession(
  store: Store,
  tokens: { accessToken: string; refreshToken: string }
) {
  store.set(ACCESS_COOKIE, tokens.accessToken, {
    ...base,
    secure: env.COOKIE_SECURE,
    maxAge: accessCookieMaxAge(tokens.accessToken),
  })
  store.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...base,
    secure: env.COOKIE_SECURE,
    maxAge: REFRESH_MAX_AGE,
  })
}

export function clearSession(store: Store) {
  store.delete(ACCESS_COOKIE)
  store.delete(REFRESH_COOKIE)
}

export async function readTokens() {
  const store = await cookies()
  return {
    accessToken: store.get(ACCESS_COOKIE)?.value,
    refreshToken: store.get(REFRESH_COOKIE)?.value,
  }
}
