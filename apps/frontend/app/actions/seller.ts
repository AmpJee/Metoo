'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, api } from '@/lib/api'
import type { BrandOrder, BrandProduct, OrderStatus } from '@/lib/types'

/**
 * Seller mutations.
 *
 * Same contract as the buyer actions: return `{ ok, error }` rather than
 * throwing, because these failures are expected and the API's message is the
 * one worth showing — "an admin cannot skip steps", "amount exceeds available
 * balance" and so on say more than any wording invented here.
 */

type Result<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string }

function fail(error: unknown): { ok: false; error: string } {
  if (error instanceof ApiError) return { ok: false, error: error.message }
  return { ok: false, error: 'Something went wrong. Please try again.' }
}

// --- orders ----------------------------------------------------------------

/**
 * Move an order forward.
 *
 * `to` comes from the order's own `actions` array, never from a list built
 * here — the state machine lives in the backend's domain layer and the UI
 * only renders what it is offered.
 */
export async function transitionOrder(
  orderId: string,
  to: OrderStatus
): Promise<Result> {
  try {
    // The body key is `status`, not `to` — the parameter is named `to` here
    // because that is what the API's `actions` array calls the destination.
    await api.patch<BrandOrder>(`/brand/orders/${orderId}/status`, {
      status: to,
    })
    revalidatePath('/seller/orders')
    revalidatePath(`/seller/orders/${orderId}`)
    // Settling an order credits the wallet, so that page is stale too.
    revalidatePath('/seller/wallet')
    revalidatePath('/seller')
    return { ok: true }
  } catch (error) {
    return fail(error)
  }
}

// --- products --------------------------------------------------------------

export type ProductInput = {
  name: string
  description?: string
  pricePerPackMinor: number
  minPacks: number
  unitsPerPack: number
  /** Grams per pack. Drives the delivery fee, so it is not optional in the UI. */
  packWeightGrams?: number
  category: string
  stockPacks?: number
  isActive?: boolean
  priceTiers?: { minPacks: number; pricePerPackMinor: number }[]
}

export async function createProduct(
  input: ProductInput
): Promise<Result<BrandProduct>> {
  try {
    const data = await api.post<BrandProduct>('/brand/products', input)
    revalidatePath('/seller/products')
    return { ok: true, data }
  } catch (error) {
    return fail(error)
  }
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>
): Promise<Result<BrandProduct>> {
  try {
    const data = await api.patch<BrandProduct>(`/brand/products/${id}`, input)
    revalidatePath('/seller/products')
    revalidatePath(`/seller/products/${id}`)
    return { ok: true, data }
  } catch (error) {
    return fail(error)
  }
}

export async function deleteProduct(id: string): Promise<Result> {
  try {
    await api.delete(`/brand/products/${id}`)
    revalidatePath('/seller/products')
    return { ok: true }
  } catch (error) {
    return fail(error)
  }
}

// --- product photos --------------------------------------------------------

/**
 * Step one of the two-step upload: ask the API where to put the file.
 *
 * The server chooses the storage path — a client cannot pick where its file
 * lands — and hands back a short-lived signed URL. The browser then PUTs the
 * bytes straight to Supabase, so the image never passes through this server.
 */
export async function requestPhotoUpload(
  productId: string,
  contentType: string,
  sizeBytes: number
): Promise<Result<{ uploadUrl: string; storageKey: string }>> {
  try {
    const data = await api.post<{
      uploadUrl: string
      token: string
      storageKey: string
    }>(`/brand/products/${productId}/photo`, { contentType, sizeBytes })
    return { ok: true, data }
  } catch (error) {
    return fail(error)
  }
}

/** Step two: record the key, once the PUT has actually succeeded. */
export async function confirmPhotoUpload(
  productId: string,
  storageKey: string
): Promise<Result<{ photoUrl: string | null }>> {
  try {
    const data = await api.put<{
      id: string
      name: string
      photoUrl: string | null
    }>(`/brand/products/${productId}/photo`, { storageKey })
    revalidatePath('/seller/products')
    revalidatePath(`/seller/products/${productId}`)
    return { ok: true, data }
  } catch (error) {
    return fail(error)
  }
}

// --- wallet ----------------------------------------------------------------

export async function requestWithdrawal(amountMinor: number): Promise<Result> {
  try {
    await api.post('/wallet/withdrawals', { amountMinor })
    revalidatePath('/seller/wallet')
    return { ok: true }
  } catch (error) {
    return fail(error)
  }
}

// --- returns ---------------------------------------------------------------

export async function reviewReturn(
  id: string,
  decision: 'accept' | 'reject',
  reviewNote?: string
): Promise<Result> {
  try {
    await api.patch(
      `/brand/returns/${id}/${decision}`,
      reviewNote ? { reviewNote } : undefined
    )
    revalidatePath('/seller/returns')
    // An accepted return refunds the buyer and debits the wallet ledger.
    revalidatePath('/seller/wallet')
    return { ok: true }
  } catch (error) {
    return fail(error)
  }
}
