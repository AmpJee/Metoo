import { redirect } from 'next/navigation'
import { ApiError, api } from '@/lib/api'
import { homeForUser } from '@/lib/roles'
import { readTokens } from '@/lib/session'
import type { Me } from '@/lib/types'

/**
 * The front door.
 *
 * A visitor lands in the catalog. This used to be the sales pitch, which is
 * the wrong thing to open with for a marketplace whose whole argument is the
 * products — someone following a shared link wants to see what is for sale,
 * not be told that things are for sale. The pitch still exists at /welcome.
 *
 * Signed-in users resolve to their own console. `/` is where proxy.ts sends
 * them after login precisely because this is the one place that knows the
 * role, and paying for that lookup here keeps it off every other navigation.
 */
export default async function HomePage() {
  const { accessToken, refreshToken } = await readTokens()

  let destination = '/explore'
  if (accessToken || refreshToken) {
    try {
      destination = homeForUser(await api.get<Me>('/auth/me'))
    } catch (error) {
      // A dead session browses the catalog rather than looping through login.
      if (!(error instanceof ApiError)) throw error
    }
  }

  redirect(destination)
}
