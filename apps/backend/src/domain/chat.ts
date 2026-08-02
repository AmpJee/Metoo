/**
 * Chat rules — pure, no Prisma, no I/O.
 *
 * Most of chat is plumbing, but two things are decisions rather than storage:
 * what counts as a message worth sending, and who is allowed to read a thread.
 * Both are one-liners that are wrong in an expensive way, so they are here
 * where they can be tested without a database.
 */

/** Long enough for a real question about an order, short of an essay. */
export const MAX_MESSAGE_LENGTH = 2000

export type MessageCheck =
  | { ok: true; body: string }
  | { ok: false; code: 'MESSAGE_EMPTY' | 'MESSAGE_TOO_LONG' }

/**
 * Validate and normalise in one step, returning the text to store.
 *
 * Trimming before the empty check is the point: a message of three spaces
 * passes `minLength: 1` at the schema edge, then renders as a blank bubble
 * that the other person cannot tell apart from a failed send. Returning the
 * trimmed body — rather than validating and letting the caller store the raw
 * string — means the two can never disagree.
 */
export function checkMessage(raw: string): MessageCheck {
  const body = raw.trim()

  if (body.length === 0) return { ok: false, code: 'MESSAGE_EMPTY' }
  if (body.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, code: 'MESSAGE_TOO_LONG' }
  }

  return { ok: true, body }
}

/** The two profile ids a thread joins. */
export interface ThreadParties {
  retailerId: string
  brandId: string
}

/** Whichever profile the viewer holds. A user has one or neither, never both. */
export interface Viewer {
  retailerId?: string | null
  brandId?: string | null
}

/**
 * Whether this viewer is one of the two parties.
 *
 * Written as an explicit match on both sides rather than "is the viewer's id
 * anywhere in the thread". Retailer and brand ids are both UUIDs from
 * different tables, so a laxer check would let a brand read a thread whose
 * *retailer* id happened to equal their brand id — vanishingly unlikely, and
 * silently catastrophic if it ever held.
 */
export function isParticipant(thread: ThreadParties, viewer: Viewer): boolean {
  const asRetailer =
    !!viewer.retailerId && viewer.retailerId === thread.retailerId
  const asBrand = !!viewer.brandId && viewer.brandId === thread.brandId

  return asRetailer || asBrand
}
