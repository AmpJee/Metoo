/**
 * How long an access-token cookie should live.
 *
 * Derived from the token's own `exp` rather than hardcoded, because the
 * cookie expiring is what triggers renewal in proxy.ts. If the cookie
 * outlived the token — which it would the moment JWT_ACCESS_TTL was set below
 * the hardcoded value — every request would 401 with nothing to renew from,
 * and the user would be silently signed out.
 *
 * The payload is read, not verified: only the API needs to trust this token,
 * and it verifies the signature itself. We just need the expiry.
 */

const SKEW_SECONDS = 30
const FALLBACK_SECONDS = 14 * 60

export function accessCookieMaxAge(token: string): number {
  const payload = decodePayload(token)
  const exp = typeof payload?.exp === 'number' ? payload.exp : null
  if (exp === null) return FALLBACK_SECONDS

  // Expire the cookie slightly early so renewal happens before the token is
  // actually dead, covering clock skew between this server and the API.
  const seconds = Math.floor(exp - Date.now() / 1000 - SKEW_SECONDS)

  // A token already at or past expiry still needs a positive max-age, or the
  // browser drops the cookie and the session looks broken rather than stale.
  return Math.max(seconds, 1)
}

function decodePayload(token: string): Record<string, unknown> | null {
  const segment = token.split('.')[1]
  if (!segment) return null
  try {
    const base64 = segment.replaceAll('-', '+').replaceAll('_', '/')
    return JSON.parse(atob(base64)) as Record<string, unknown>
  } catch {
    return null
  }
}
