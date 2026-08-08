'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, api } from '@/lib/api'
import { isSignInRequired } from '@/lib/sign-in-required'
import type { Cart } from '@/lib/types'

/**
 * Cart mutations.
 *
 * Server Actions rather than client fetches: the access token is an httpOnly
 * cookie the browser cannot read, so every call to the API has to originate
 * on the server anyway.
 *
 * Each returns `{ error }` instead of throwing, because the failures here are
 * expected and need to reach the user as words — a quantity below MOQ or off
 * the case-size multiple comes back as a 422 with a message worth showing.
 */

type Result =
  { ok: true } | { ok: false; error: string; signInRequired?: boolean }

function toResult(error: unknown): Result {
  // A visitor browsing the public catalog has not done anything wrong; the
  // caller turns this into a trip to the sign-in page, not a red message.
  if (isSignInRequired(error)) {
    return { ok: false, error: '', signInRequired: true }
  }
  if (error instanceof ApiError) return { ok: false, error: error.message }
  return { ok: false, error: 'Something went wrong. Please try again.' }
}

/** Revalidate everywhere the cart is visible — including the header badge. */
function revalidateCart() {
  revalidatePath('/', 'layout')
}

export async function addToCart(
  productId: string,
  packs: number
): Promise<Result> {
  try {
    await api.post<Cart>('/cart/items', { productId, packs })
    revalidateCart()
    return { ok: true }
  } catch (error) {
    return toResult(error)
  }
}

export async function updateCartItem(
  itemId: string,
  packs: number
): Promise<Result> {
  try {
    await api.patch<Cart>(`/cart/items/${itemId}`, { packs })
    revalidateCart()
    return { ok: true }
  } catch (error) {
    return toResult(error)
  }
}

export async function removeCartItem(itemId: string): Promise<Result> {
  try {
    await api.delete<Cart>(`/cart/items/${itemId}`)
    revalidateCart()
    return { ok: true }
  } catch (error) {
    return toResult(error)
  }
}

export async function clearCart(): Promise<Result> {
  try {
    await api.delete<Cart>('/cart')
    revalidateCart()
    return { ok: true }
  } catch (error) {
    return toResult(error)
  }
}
