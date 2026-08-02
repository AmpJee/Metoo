'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, api } from '@/lib/api'
import type { SavedKind, ToggleResult } from '@/lib/types'

/**
 * Favourites and save-for-later.
 *
 * Two separate lists over one model, and two separate paths on the API —
 * `/favourites` and `/saved-for-later` — so a caller cannot forget which it
 * meant. `kind` picks the path.
 */

const PATHS: Record<SavedKind, string> = {
  FAVOURITE: '/favourites',
  SAVED_FOR_LATER: '/saved-for-later',
}

type Result = { ok: true; saved: boolean } | { ok: false; error: string }

export async function toggleSaved(
  productId: string,
  kind: SavedKind,
  currentlySaved: boolean
): Promise<Result> {
  const path = `${PATHS[kind]}/${productId}`

  try {
    const result = currentlySaved
      ? await api.delete<ToggleResult>(path)
      : await api.post<ToggleResult>(path)

    revalidatePath('/saved')
    return { ok: true, saved: result.saved }
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.message }
    return { ok: false, error: 'Could not update your list.' }
  }
}
