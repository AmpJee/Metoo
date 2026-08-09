'use server'

import { api } from '@/lib/api'
import type { AddressDistrict } from '@/lib/types'

/**
 * Districts and sub-districts for one province.
 *
 * A server action rather than a fetch from the browser, because the browser
 * never calls Elysia directly — `API_URL` is not public and `lib/api.ts`
 * attaches the session server-side. The route itself is public, but going
 * around the proxy for this one call would be the exception that makes the
 * rule stop meaning anything.
 *
 * Returns an empty list on failure instead of throwing. The caller is a form:
 * a missing dropdown that falls back to typing is recoverable, and an
 * exception mid-edit is not.
 */
export async function districtsForProvince(
  province: string
): Promise<AddressDistrict[]> {
  if (!province.trim()) return []

  try {
    const data = await api.get<{ districts: AddressDistrict[] }>(
      `/address/districts?province=${encodeURIComponent(province)}`
    )
    return data.districts
  } catch {
    return []
  }
}
