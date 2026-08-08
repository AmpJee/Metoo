'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, api } from '@/lib/api'
import type { Order } from '@/lib/types'

/**
 * Step one of sending a transfer slip: a URL to PUT the file to.
 *
 * Same two-step shape as every other upload here. The bytes go straight from
 * the browser to storage, so a 10 MB photo never travels through the Next
 * server, and the API records nothing until the object is confirmed to exist.
 */
export async function requestSlipUpload(
  orderId: string,
  contentType: string,
  sizeBytes: number
): Promise<
  | { ok: true; uploadUrl: string; storageKey: string }
  | { ok: false; error: string }
> {
  try {
    const data = await api.post<{ uploadUrl: string; storageKey: string }>(
      `/orders/${orderId}/payment-slip/upload-url`,
      { contentType, sizeBytes }
    )
    return { ok: true, ...data }
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.message }
    return { ok: false, error: 'Could not start the upload.' }
  }
}

/** Step two: record the key, once the PUT has actually succeeded. */
export async function confirmSlipUpload(
  orderId: string,
  storageKey: string
): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
  try {
    const order = await api.post<Order>(`/orders/${orderId}/payment-slip`, {
      storageKey,
    })
    revalidatePath('/orders')
    revalidatePath(`/orders/${orderId}`)
    return { ok: true, order }
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.message }
    return { ok: false, error: 'Could not record the slip.' }
  }
}

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
