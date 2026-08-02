import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { REFRESH_COOKIE, clearSession } from '@/lib/session'

/**
 * Revokes the refresh token server-side, then drops the cookies.
 *
 * The revoke is best-effort: if the API call fails we still clear the
 * cookies, because leaving a user apparently signed in after they asked to
 * leave is the worse failure.
 */
export async function POST() {
  const store = await cookies()
  const refreshToken = store.get(REFRESH_COOKIE)?.value

  if (refreshToken) {
    try {
      await fetch(`${env.API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        cache: 'no-store',
      })
    } catch {
      // Ignored — see above.
    }
  }

  clearSession(store)
  return NextResponse.json({ ok: true })
}
