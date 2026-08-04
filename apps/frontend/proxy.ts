import { NextResponse, type NextRequest } from 'next/server'
import { accessCookieMaxAge } from './lib/token-lifetime'

/**
 * Session renewal and route gating.
 *
 * `proxy.ts` is Next 16's replacement for `middleware.ts` — same capability,
 * clearer name. It is the only place that can both read the refresh cookie
 * and write a new one onto the response, which is why refresh lives here
 * rather than in the API client. The access cookie is deliberately given a
 * shorter max-age (14m) than the token's real lifetime (15m), so the cookie
 * disappearing is the signal to renew — we never decode the JWT or guess at
 * expiry.
 *
 * Approval gating is NOT here: it needs GET /auth/me, and an extra API call
 * on every navigation is too costly. The (shop) layout does it instead, from
 * a fetch it already makes.
 */

const ACCESS_COOKIE = 'metoo_at'
const REFRESH_COOKIE = 'metoo_rt'

/** Reachable without a session. Everything else requires one. */
const PUBLIC_PATHS = ['/', '/login', '/register']

function isPublic(pathname: string) {
  return PUBLIC_PATHS.includes(pathname)
}

async function renew(refreshToken: string) {
  try {
    const response = await fetch(
      `${process.env.API_URL ?? 'http://localhost:3000'}/auth/refresh`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        cache: 'no-store',
      }
    )
    if (!response.ok) return null
    return (await response.json()) as {
      accessToken: string
      refreshToken: string
      user?: { status?: string }
    }
  } catch {
    // The API being unreachable must not hard-fail navigation; the page will
    // surface the error itself.
    return null
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value

  let renewed: Awaited<ReturnType<typeof renew>> = null

  // Access cookie gone but refresh still valid — renew before the page runs,
  // so a Server Component never sees a half-expired session.
  if (!accessToken && refreshToken) {
    renewed = await renew(refreshToken)
    if (renewed) accessToken = renewed.accessToken
  }

  const signedIn = Boolean(accessToken)

  const forward = () => NextResponse.next()

  /** Attach a renewed session to whatever response we return. */
  const withSession = (response: NextResponse) => {
    if (renewed) {
      const secure = process.env.NODE_ENV === 'production'
      response.cookies.set(ACCESS_COOKIE, renewed.accessToken, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure,
        // From the token's own exp — see lib/token-lifetime.ts.
        maxAge: accessCookieMaxAge(renewed.accessToken),
      })
      // Rotation: the refresh token just used is now dead server-side. Failing
      // to persist this replacement logs the user out on the next request.
      response.cookies.set(REFRESH_COOKIE, renewed.refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure,
        maxAge: 29 * 24 * 60 * 60,
      })
    }
    return response
  }

  const redirect = (to: string) =>
    withSession(NextResponse.redirect(new URL(to, request.url)))

  if (!signedIn) {
    if (isPublic(pathname)) return forward()
    const target = new URL('/login', request.url)
    // Come back where they were trying to go once signed in.
    if (pathname !== '/') target.searchParams.set('next', pathname + search)
    return NextResponse.redirect(target)
  }

  // Signed in: keep them out of the auth screens. Sent to `/` rather than a
  // fixed console because the role is not known here — resolving it would
  // cost a /auth/me call on every navigation. The landing page does it once.
  if (pathname === '/login' || pathname === '/register') {
    return redirect('/')
  }

  return withSession(forward())
}

export const config = {
  matcher: [
    // Everything except Next internals, the auth proxy routes (they manage
    // their own cookies), and static files.
    '/((?!_next/static|_next/image|api/auth|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
