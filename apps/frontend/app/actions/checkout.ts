'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, api } from '@/lib/api'
import type { CheckoutResult } from '@/lib/types'

type PaymentPreference = 'PROMPTPAY' | 'CASH' | 'CARD'

/**
 * Places the cart.
 *
 * The API creates ONE ORDER PER BRAND sharing a checkoutGroupId, re-validates
 * every line against the product as it stands now, snapshots prices and the
 * commission rate, and empties the cart.
 *
 * `paymentMethod` is a stated preference recorded on the order, not a charge:
 * there is no payment module on the API yet, so nothing is collected here.
 */
export async function placeOrder(
  paymentMethod: PaymentPreference
): Promise<
  { ok: true; result: CheckoutResult } | { ok: false; error: string }
> {
  try {
    const result = await api.post<CheckoutResult>('/checkout', {
      paymentMethod,
    })
    revalidatePath('/', 'layout')
    return { ok: true, result }
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.message }
    return { ok: false, error: 'Could not place your order. Please try again.' }
  }
}
