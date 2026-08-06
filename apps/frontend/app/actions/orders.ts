'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, api } from '@/lib/api'
import type { Order } from '@/lib/types'

/**
 * Confirm the goods arrived — the retailer's only move on an order.
 *
 * This settles the order and releases the brand's money, so it is worth the
 * buyer understanding that it is not just a tidy-up. The API accepts it only
 * from DELIVERED and refuses a second press, so no guard is needed here; the
 * message it sends back is the one worth showing.
 */
export async function confirmDelivered(
  orderId: string
): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
  try {
    const order = await api.patch<Order>(
      `/orders/${orderId}/confirm-delivered`,
      {}
    )
    revalidatePath('/orders')
    revalidatePath(`/orders/${orderId}`)
    return { ok: true, order }
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.message }
    return { ok: false, error: 'Could not confirm this order.' }
  }
}
