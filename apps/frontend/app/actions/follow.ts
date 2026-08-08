'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, api } from '@/lib/api'
import { isSignInRequired } from '@/lib/sign-in-required'
import type { FollowResult } from '@/lib/types'

/** Follow / unfollow a brand's storefront. */
export async function toggleFollow(
  brandId: string,
  currentlyFollowing: boolean
): Promise<
  | { ok: true; result: FollowResult }
  | { ok: false; error: string; signInRequired?: boolean }
> {
  const path = `/stores/${brandId}/follow`
  try {
    const result = currentlyFollowing
      ? await api.delete<FollowResult>(path)
      : await api.post<FollowResult>(path)

    revalidatePath(`/stores/${brandId}`)
    revalidatePath('/stores')
    return { ok: true, result }
  } catch (error) {
    if (isSignInRequired(error)) {
      return { ok: false, error: '', signInRequired: true }
    }
    if (error instanceof ApiError) return { ok: false, error: error.message }
    return { ok: false, error: 'Could not update.' }
  }
}
