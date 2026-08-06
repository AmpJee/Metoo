'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, api } from '@/lib/api'
import type { Review } from '@/lib/types'

/**
 * Rate a product.
 *
 * PUT, not POST — one review per retailer per product, so submitting again is
 * a change of mind rather than a second review. The API refuses this with 403
 * unless the caller has a delivered order containing the product, which is
 * what keeps a brand from rating its own goods.
 */
export async function submitReview(
  productId: string,
  rating: number,
  comment: string
): Promise<{ ok: true; review: Review } | { ok: false; error: string }> {
  try {
    const review = await api.put<Review>(`/products/${productId}/reviews`, {
      rating,
      // An empty box means "no comment", not an empty string.
      ...(comment.trim() ? { comment: comment.trim() } : {}),
    })
    revalidatePath(`/products/${productId}`)
    revalidatePath('/orders')
    return { ok: true, review }
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.message }
    return { ok: false, error: 'Could not save your review.' }
  }
}

/** Idempotent — removing a review that is not there is not an error. */
export async function removeReview(
  productId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await api.delete(`/products/${productId}/reviews`)
    revalidatePath(`/products/${productId}`)
    revalidatePath('/orders')
    return { ok: true }
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.message }
    return { ok: false, error: 'Could not remove your review.' }
  }
}
