import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { writeSession } from '@/lib/session'
import type { Session } from '@/lib/types'

/**
 * Retailer signup.
 *
 * Only RETAILER is accepted here: this is the buyer app, and the backend
 * takes a discriminated union where a brand signup needs different fields.
 * Brand onboarding is a separate surface — the design says as much
 * ("Brand sign-up coming soon").
 */
export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>

  const response = await fetch(`${env.API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...body, role: 'RETAILER' }),
    cache: 'no-store',
  })

  const payload = await response.json()

  if (!response.ok) {
    return NextResponse.json(payload, { status: response.status })
  }

  const session = payload as Session
  writeSession(await cookies(), session)

  // A new account is NOT_CONTACTED, so the client always routes to /pending.
  return NextResponse.json({ status: session.user.status })
}
