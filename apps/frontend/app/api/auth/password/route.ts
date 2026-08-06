import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { readTokens, writeSession } from '@/lib/session'

/**
 * Change the signed-in user's password.
 *
 * A route handler rather than a server action because of what the API returns:
 * changing a password revokes every other session and issues a FRESH token
 * pair. Those have to be written to the cookies in the same response, or the
 * user is signed out by their own password change — the old refresh token is
 * dead the moment the API returns.
 */
export async function POST(request: Request) {
  const { currentPassword, newPassword } = (await request.json()) as {
    currentPassword?: string
    newPassword?: string
  }

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      {
        error: {
          code: 'MISSING_FIELDS',
          message: 'Both your current and new password are required.',
        },
      },
      { status: 422 }
    )
  }

  const { accessToken } = await readTokens()
  if (!accessToken) {
    return NextResponse.json(
      { error: { code: 'UNAUTHENTICATED', message: 'Sign in again.' } },
      { status: 401 }
    )
  }

  const response = await fetch(`${env.API_URL}/auth/password`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
    cache: 'no-store',
  })

  const payload = await response.json()
  if (!response.ok) {
    return NextResponse.json(payload, { status: response.status })
  }

  // The whole reason this is a route handler. Skip it and the next request
  // arrives with a revoked refresh token.
  writeSession(await cookies(), payload)

  return NextResponse.json({ ok: true })
}
