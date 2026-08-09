import { NextResponse, type NextRequest } from 'next/server'
import { accessCookieMaxAge } from './lib/token-lifetime'
import { LOGIN_PATHS, SIGNUP_PATHS, loginPathFor } from './lib/portals'

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

/**
 * Reachable without a session. Everything else requires one.
 *
 * All three sign-in pages, not just the shop's — leaving the seller and admin
 * ones out would bounce them to the shop login, which is the confusion the
 * split exists to remove.
 */
const PUBLIC_PATHS = ['/', '/welcome', ...SIGNUP_PATHS, ...LOGIN_PATHS]

/**
 * The catalog, which anyone may read. Prefixes rather than exact paths
 * because product and storefront ids are in the URL.
 *
 * This list must stay in step with `app/(public)/` — a page in that group
 * that is missing here is unreachable for the visitor it was written for.
 * Nothing that acts on a cart or an order belongs in either.
 */
const PUBLIC_PREFIXES = ['/about', '/explore', '/help', '/products/', '/stores']

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix)
  )
}

/** An auth screen a signed-in user should not be sitting on. */
function isAuthScreen(pathname: string) {
  return SIGNUP_PATHS.includes(pathname) || LOGIN_PATHS.includes(pathname)
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
    // Send them to the sign-in page for the site they were trying to reach.
    const target = new URL(loginPathFor(pathname), request.url)
    // Come back where they were trying to go once signed in.
    if (pathname !== '/') target.searchParams.set('next', pathname + search)
    return NextResponse.redirect(target)
  }

  // Signed in: keep them out of the auth screens. Sent to `/` rather than a
  // fixed console because the role is not known here — resolving it would
  // cost a /auth/me call on every navigation. The landing page does it once.
  if (isAuthScreen(pathname)) {
    return redirect('/')
  }

  return withSession(forward())
}

export const config = {
  matcher: [
    // Everything except Next internals, the auth proxy routes (they manage
    // their own cookies), the healthcheck, the metadata files, and static
    // files.
    //
    // `healthz` is excluded rather than listed as public: a liveness probe
    // has no session to renew, and running the whole auth path on it would
    // make the platform's view of "is this server up" depend on the API.
    //
    // `opengraph-image` and friends are excluded for the same reason from the
    // other direction: the things fetching them are chat apps and crawlers
    // with no cookies, and a link preview that redirects to a login page
    // silently falls back to whatever image the page contains — which is the
    // bug this whole change exists to fix.
    '/((?!_next/static|_next/image|api/auth|healthz|opengraph-image|twitter-image|icon|apple-icon|robots.txt|sitemap.xml|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
