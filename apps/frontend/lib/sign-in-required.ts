import { ApiError } from '@/lib/api'

/**
 * Did this fail only because nobody is signed in?
 *
 * The catalog is public but every action on it is not, so a visitor pressing
 * Add to Cart is not making a mistake — they have simply reached the point
 * where an account starts to matter. That is a redirect to sign-up, not an
 * error message.
 *
 * Deliberately a check on the response rather than a flag passed down from
 * the page: it also catches the session that expired while someone was
 * reading, which a prop resolved at render time would get wrong.
 *
 * `isNotOnboarded` counts too. An applicant still in the pipeline is signed
 * in and still cannot buy; sending them to /login lets the shop layout route
 * them on to /pending, which is the screen that explains why.
 */
export function isSignInRequired(error: unknown): boolean {
  return (
    error instanceof ApiError && (error.isUnauthorized || error.isNotOnboarded)
  )
}

/** What a client component does about it: sign in, then come back here. */
export function loginHref(pathname: string): string {
  return `/login?next=${encodeURIComponent(pathname)}`
}
