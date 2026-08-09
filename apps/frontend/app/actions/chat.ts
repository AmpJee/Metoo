'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, api } from '@/lib/api'
import { isSignInRequired } from '@/lib/sign-in-required'
import type { ChatMessage } from '@/lib/types'

type Result<T> =
  { ok: true; data: T } | { ok: false; error: string; signInRequired?: boolean }

function fail(error: unknown, fallback: string) {
  // A storefront is public but messaging a brand is not, so pressing the
  // button signed out is the same "you need an account" moment as Add to
  // Cart — the caller turns this into a trip to sign-in, not a red message.
  if (isSignInRequired(error)) {
    return { ok: false as const, error: '', signInRequired: true }
  }
  if (error instanceof ApiError)
    return { ok: false as const, error: error.message }
  return { ok: false as const, error: fallback }
}

/**
 * Send a message in a thread either side is already part of.
 *
 * Revalidates the whole chat surface rather than one thread: the list shows
 * each conversation's last message, so a reply changes two screens.
 */
export async function sendMessage(
  threadId: string,
  body: string
): Promise<Result<ChatMessage>> {
  try {
    const data = await api.post<ChatMessage>(
      `/chat/threads/${threadId}/messages`,
      {
        body,
      }
    )
    revalidatePath('/chat')
    return { ok: true, data }
  } catch (error) {
    return fail(error, 'Could not send that message.')
  }
}

/**
 * Open the conversation with a brand, from a storefront or an order.
 *
 * Idempotent on the API — you get the existing thread back if there is one —
 * so pressing the button twice cannot split a history in two.
 */
export async function startThread(
  brandId: string,
  message: string
): Promise<Result<{ id: string }>> {
  try {
    const data = await api.post<{ id: string }>('/chat/threads', {
      brandId,
      message,
    })
    revalidatePath('/chat')
    return { ok: true, data }
  } catch (error) {
    return fail(error, 'Could not start that conversation.')
  }
}

/** Clear the other side's unread badge once their messages are on screen. */
export async function markThreadRead(threadId: string) {
  try {
    await api.patch(`/chat/threads/${threadId}/read`, {})
    revalidatePath('/chat')
  } catch {
    // Non-fatal: a badge that clears late is better than a thread that fails
    // to open because marking it read went wrong.
  }
}
