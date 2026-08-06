/**
 * The order lifecycle — pure, no Prisma, no I/O.
 *
 * Six steps, and each one names who may make the move:
 *
 *   1 PENDING          "Confirm Order"       BRAND
 *   2 CONFIRMED        "Package Pickup"      ADMIN
 *   3 READY_FOR_PICKUP "Out for Delivery"    ADMIN
 *   4 PICKED_UP        "Mark Delivered"      ADMIN
 *   5 DELIVERED        "Confirm Delivered"   ADMIN or RETAILER
 *   6 SETTLED          done
 *
 * Logistics is a manual, human-run operation, so admin drives steps 2–5. The
 * two exceptions are the two ends of the deal: the BRAND accepts the order,
 * and the RETAILER confirms they received it. That last one is what releases
 * the brand's money, which is why the buyer is given it — admin can still
 * press it when a retailer goes quiet.
 *
 * Every transition is explicit. A map of what may follow what — rather than
 * an ordered list and an index comparison — is what makes CANCELLED reachable
 * from the early states but not the late ones, and stops a mis-typed status
 * from silently skipping the middle of the flow.
 */

import type { OrderStatus, Role } from '@metoo/shared'

/**
 * Who may move an order into a given state.
 *
 * RETAILER is here for exactly one move — DELIVERED to SETTLED. It is not a
 * general operator of the machine, and the actors list on every other
 * transition is what keeps it that way.
 */
export type Actor = Extract<Role, 'BRAND' | 'ADMIN' | 'RETAILER'>

interface Transition {
  to: OrderStatus
  /** The label the seller's button shows for this step. */
  label: string
  /** Roles allowed to make this move. Admin may override anything below. */
  actors: Actor[]
}

/**
 * Allowed moves out of each state.
 *
 * SETTLED and CLOSED are absent as sources: an order whose money has been
 * received or whose return has been resolved is finished, and reopening it
 * would mean unwinding wallet ledger rows that are append-only by design.
 */
const TRANSITIONS: Record<OrderStatus, Transition[]> = {
  // Step 1 -> 2. The brand's own decision: it is their stock and their
  // capacity, so accepting is not admin's to do on their behalf. Admin is
  // still listed as the override for a brand that has gone quiet.
  PENDING: [
    { to: 'CONFIRMED', label: 'Confirm Order', actors: ['BRAND', 'ADMIN'] },
    { to: 'CANCELLED', label: 'Cancel Order', actors: ['BRAND', 'ADMIN'] },
  ],
  // Steps 2 -> 5 are logistics, which is a manual operation admin runs. A
  // brand cannot claim its own parcel was collected or delivered.
  CONFIRMED: [
    { to: 'READY_FOR_PICKUP', label: 'Package Pickup', actors: ['ADMIN'] },
    { to: 'CANCELLED', label: 'Cancel Order', actors: ['BRAND', 'ADMIN'] },
  ],
  READY_FOR_PICKUP: [
    { to: 'PICKED_UP', label: 'Out for Delivery', actors: ['ADMIN'] },
  ],
  // Once goods are with a courier, cancelling is a return, not a cancellation.
  PICKED_UP: [{ to: 'DELIVERED', label: 'Mark Delivered', actors: ['ADMIN'] }],
  // Step 5 -> 6. The retailer confirming receipt is what releases the brand's
  // money, so the buyer holds this one. The brand is deliberately NOT an
  // actor here: letting the seller declare their own sale complete would let
  // them credit their own wallet.
  DELIVERED: [
    {
      to: 'SETTLED',
      label: 'Confirm Delivered',
      actors: ['RETAILER', 'ADMIN'],
    },
  ],
  SETTLED: [],
  CANCELLED: [],
  CLOSED: [],
}

/** Timestamp column to stamp when an order enters a state, if any. */
export const TIMESTAMP_FIELD: Partial<Record<OrderStatus, string>> = {
  CONFIRMED: 'confirmedAt',
  READY_FOR_PICKUP: 'readyForPickupAt',
  PICKED_UP: 'pickedUpAt',
  DELIVERED: 'deliveredAt',
  SETTLED: 'settledAt',
  CLOSED: 'closedAt',
}

/**
 * Orders that count as real revenue — GMV on the admin summary, revenue on the
 * seller dashboard.
 *
 * PENDING is excluded because a request a brand has not accepted is not a
 * sale; counting it would make revenue fall whenever a brand declines
 * something. CANCELLED is excluded for the obvious reason.
 *
 * Defined once and imported everywhere. Two copies of this list means one
 * screen eventually disagrees with another about how much money was made.
 */
export const EARNS_REVENUE = [
  'CONFIRMED',
  'READY_FOR_PICKUP',
  'PICKED_UP',
  'DELIVERED',
  'SETTLED',
  'CLOSED',
] as const satisfies readonly OrderStatus[]

/**
 * Orders that count toward a brand's commission volume tier.
 *
 * Identical to EARNS_REVENUE except that CLOSED is excluded: an order closed
 * after a return should not help a brand reach the discounted rate.
 *
 * The two lists are deliberately separate rather than one with an exception —
 * they answer different questions, and a future change to one is unlikely to
 * apply to the other.
 */
export const COUNTS_TOWARD_VOLUME = EARNS_REVENUE.filter(
  (status) => status !== 'CLOSED'
) as Exclude<(typeof EARNS_REVENUE)[number], 'CLOSED'>[]

export type TransitionCheck =
  { ok: true } | { ok: false; code: string; message: string }

/**
 * May `actor` move an order from `from` to `to`?
 *
 * Returns a result rather than throwing — the domain layer has no opinion
 * about HTTP, and the caller turns this into an AppError.
 */
export function canTransition(
  from: OrderStatus,
  to: OrderStatus,
  actor: Actor
): TransitionCheck {
  if (from === to) {
    return {
      ok: false,
      code: 'ORDER_ALREADY_IN_STATE',
      message: `This order is already ${to}.`,
    }
  }

  const allowed = TRANSITIONS[from]

  if (allowed.length === 0) {
    return {
      ok: false,
      code: 'ORDER_FINAL',
      message: `An order that is ${from} cannot be changed.`,
    }
  }

  const move = allowed.find((t) => t.to === to)

  if (!move) {
    return {
      ok: false,
      code: 'ILLEGAL_TRANSITION',
      message: `An order cannot go from ${from} to ${to}. Next: ${allowed
        .map((t) => t.to)
        .join(' or ')}.`,
    }
  }

  if (!move.actors.includes(actor)) {
    return {
      ok: false,
      code: 'FORBIDDEN_TRANSITION',
      message: `Only ${move.actors.join(' or ')} may mark an order ${to}.`,
    }
  }

  return { ok: true }
}

/**
 * The moves available from a state, for a given actor.
 *
 * The seller's card renders one button per entry, so returning the label here
 * keeps the wording in one place rather than duplicated in the frontend.
 */
export function availableTransitions(
  from: OrderStatus,
  actor: Actor
): Array<{ to: OrderStatus; label: string }> {
  return TRANSITIONS[from]
    .filter((t) => t.actors.includes(actor))
    .map(({ to, label }) => ({ to, label }))
}

/** Is this a state no transition can leave? */
export function isFinal(status: OrderStatus): boolean {
  return TRANSITIONS[status].length === 0
}
