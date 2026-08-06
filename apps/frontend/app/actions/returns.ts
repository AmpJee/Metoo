'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, api } from '@/lib/api'
import type { ReturnRequest } from '@/lib/types'

/**
 * Raise a return.
 *
 * Allowed only against a DELIVERED or SETTLED order, one per order — the API
 * enforces both, and returns 404 (not 403) for an order belonging to someone
 * else, so the message it sends back is the one worth showing.
 */
export async function requestReturn(
  orderId: string,
  reason: string
): Promise<{ ok: true; result: ReturnRequest } | { ok: false; error: string }> {
  try {
    const result = await api.post<ReturnRequest>('/returns', {
      orderId,
      reason,
    })
    revalidatePath('/returns')
    revalidatePath(`/orders/${orderId}`)
    return { ok: true, result }
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.message }
    return { ok: false, error: 'Could not submit your request.' }
  }
}
