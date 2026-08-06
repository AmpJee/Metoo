import type { Role } from './types'

/**
 * The three sign-in pages, one per surface.
 *
 * Each site has its own login so it can refuse the wrong kind of account
 * outright. Without that, a brand signing in on the shop gets a valid token
 * and then 403s on every screen, which reads as a broken site rather than a
 * wrong turn.
 *
 * `apiPath` mirrors the backend's own split (`/auth/login/{retailer,brand,
 * admin}`); those routes answer 403 WRONG_PORTAL and name where to go instead.
 */
export const PORTALS = {
  retailer: {
    loginPath: '/login',
    apiPath: '/auth/login/retailer',
    role: 'RETAILER',
    title: 'Welcome back',
    subtitle: 'Sign in to browse wholesale pricing and place orders.',
  },
  seller: {
    loginPath: '/login/seller',
    apiPath: '/auth/login/brand',
    role: 'BRAND',
    title: 'Seller Centre',
    subtitle: 'Sign in to manage your products, orders and payouts.',
  },
  admin: {
    loginPath: '/login/admin',
    apiPath: '/auth/login/admin',
    role: 'ADMIN',
    title: 'Management Console',
    subtitle: 'Staff sign-in.',
  },
} as const satisfies Record<
  string,
  {
    loginPath: string
    apiPath: string
    role: Role
    title: string
    subtitle: string
  }
>

export type PortalKey = keyof typeof PORTALS

export function isPortalKey(value: unknown): value is PortalKey {
  return typeof value === 'string' && value in PORTALS
}

/**
 * Every login URL, so the proxy can treat them all as public.
 *
 * Widened to string[]: the literal union inferred from PORTALS would reject
 * `.includes(pathname)` for an arbitrary request path, which is the only thing
 * this list is for.
 */
export const LOGIN_PATHS: string[] = Object.values(PORTALS).map(
  (p) => p.loginPath
)

/**
 * Which sign-in page an expired session should land on.
 *
 * Bouncing a brand to the shop's login would show them "wrong portal" for
 * their own account, which is the confusion the split was meant to remove.
 */
export function loginPathFor(pathname: string): string {
  if (pathname.startsWith('/seller')) return PORTALS.seller.loginPath
  if (pathname.startsWith('/admin')) return PORTALS.admin.loginPath
  return PORTALS.retailer.loginPath
}
