'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, api } from '@/lib/api'
import type { BrandProfile, RetailerProfile, SignedUpload } from '@/lib/types'

type Result<T> = { ok: true; data: T } | { ok: false; error: string }

function failed(error: unknown, fallback: string) {
  if (error instanceof ApiError)
    return { ok: false as const, error: error.message }
  return { ok: false as const, error: fallback }
}

/**
 * The API rejects an empty PATCH with 422 rather than answering 200 on an
 * unchanged row, so only changed fields are sent. Comparing against what was
 * loaded also means a form submitted untouched is a no-op instead of a write.
 */
function changedOnly<T extends Record<string, unknown>>(
  next: T,
  current: T
): Partial<T> {
  const diff: Partial<T> = {}
  for (const key of Object.keys(next) as (keyof T)[]) {
    if (next[key] !== current[key]) diff[key] = next[key]
  }
  return diff
}

export async function updateRetailerProfile(
  next: Partial<RetailerProfile>,
  current: Partial<RetailerProfile>
): Promise<Result<RetailerProfile> | { ok: true; data: null }> {
  const body = changedOnly(next, current)
  if (Object.keys(body).length === 0) return { ok: true, data: null }

  try {
    const data = await api.patch<RetailerProfile>('/retailer/profile', body)
    revalidatePath('/settings')
    return { ok: true, data }
  } catch (error) {
    return failed(error, 'Could not save your profile.')
  }
}

export async function updateBrandProfile(
  next: Partial<BrandProfile>,
  current: Partial<BrandProfile>
): Promise<Result<BrandProfile> | { ok: true; data: null }> {
  const body = changedOnly(next, current)
  if (Object.keys(body).length === 0) return { ok: true, data: null }

  try {
    const data = await api.patch<BrandProfile>('/brand/profile', body)
    revalidatePath('/seller/settings')
    return { ok: true, data }
  } catch (error) {
    return failed(error, 'Could not save your profile.')
  }
}

/**
 * Where withdrawals are paid.
 *
 * Separate from the profile edit because it is a different kind of change: an
 * admin reads these to make a manual bank transfer, so rewriting where money
 * lands should be a deliberate act, not a side effect of fixing an address.
 * The full account number is write-only — reads give the last four digits.
 */
export async function updateBankDetails(bank: {
  bankName: string
  bankAccountName: string
  bankAccountNumber: string
}): Promise<Result<BrandProfile>> {
  try {
    const data = await api.put<BrandProfile>('/brand/profile/bank', bank)
    revalidatePath('/seller/settings')
    revalidatePath('/seller/wallet')
    return { ok: true, data }
  } catch (error) {
    return failed(error, 'Could not save your bank details.')
  }
}

// --- profile picture, two steps ---------------------------------------------
// Step one asks for a signed URL, the browser PUTs the bytes straight to
// storage, step two records the key. The bytes never pass through Next.

const PICTURE_PATH = {
  retailer: '/retailer/profile/picture',
  brand: '/brand/profile/picture',
} as const

export async function requestPictureUpload(
  who: keyof typeof PICTURE_PATH,
  contentType: string,
  sizeBytes: number
): Promise<Result<SignedUpload>> {
  try {
    const data = await api.post<SignedUpload>(PICTURE_PATH[who], {
      contentType,
      sizeBytes,
    })
    return { ok: true, data }
  } catch (error) {
    return failed(error, 'Could not start the upload.')
  }
}

export async function confirmPictureUpload(
  who: keyof typeof PICTURE_PATH,
  storageKey: string
): Promise<Result<{ logoUrl: string | null }>> {
  try {
    const data = await api.put<{ logoUrl: string | null }>(PICTURE_PATH[who], {
      storageKey,
    })
    revalidatePath(who === 'retailer' ? '/settings' : '/seller/settings')
    return { ok: true, data }
  } catch (error) {
    return failed(error, 'Could not save that picture.')
  }
}
