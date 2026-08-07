import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { writeSession } from '@/lib/session'
import type { Session } from '@/lib/types'

/**
 * Signup, for either side of the marketplace.
 *
 * The backend takes a discriminated union — a brand sends `name` and an
 * optional description, a retailer sends `shopName` and an optional taxId —
 * so the role decides which shape is valid and cannot be inferred from the
 * fields alone.
 *
 * The role is pinned to one of the two literals here rather than passed
 * through: forwarding whatever the client sent would let a caller register
 * itself as ADMIN, and admins are seeded, never self-registered.
 */
export async function POST(request: Request) {
  const { role, ...body } = (await request.json()) as Record<string, unknown>

  const response = await fetch(`${env.API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      ...body,
      role: role === 'BRAND' ? 'BRAND' : 'RETAILER',
    }),
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
