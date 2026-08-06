import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { PORTALS, isPortalKey } from '@/lib/portals'
import { writeSession } from '@/lib/session'
import type { Session } from '@/lib/types'

/**
 * Exchanges credentials for cookies.
 *
 * The tokens are read here and never leave the server — the browser gets
 * httpOnly cookies and a small JSON body saying where to go next.
 */
export async function POST(request: Request) {
  const { email, password, portal } = (await request.json()) as {
    email?: string
    password?: string
    portal?: string
  }

  if (!email || !password) {
    return NextResponse.json(
      {
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email and password are required.',
        },
      },
      { status: 422 }
    )
  }

  // Each sign-in page names its own portal, so the API can refuse an account
  // that belongs on a different site. An unrecognised value falls back to the
  // any-role route rather than 500ing — the worst case is the old behaviour.
  const apiPath = isPortalKey(portal) ? PORTALS[portal].apiPath : '/auth/login'

  const response = await fetch(`${env.API_URL}${apiPath}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  })

  const payload = await response.json()

  if (!response.ok) {
    return NextResponse.json(payload, { status: response.status })
  }

  const session = payload as Session
  writeSession(await cookies(), session)

  // Login succeeds for unapproved accounts by design, so the caller needs to
  // know whether to land on the catalog or the pending screen.
  return NextResponse.json({
    status: session.user.status,
    role: session.user.role,
  })
}
