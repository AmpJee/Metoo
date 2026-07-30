/**
 * The order lifecycle — pure, no Prisma, no I/O.
 *
 * The seller's tracker walks seven steps, each with one button:
 *
 *   PENDING          "Confirm Order"
 *   CONFIRMED        "Prepare Package"
 *   PREPARING        "Mark Ready for Pickup"
 *   READY_FOR_PICKUP "Confirm Pickup"
 *   PICKED_UP        "Mark Delivered"
 *   DELIVERED        "Confirm Money Received"
 *   SETTLED          done
 *
 * Every transition is explicit. A map of what may follow what — rather than
 * an ordered list and an index comparison — is what makes CANCELLED reachable
 * from the early states but not the late ones, and stops a mis-typed status
 * from silently skipping the middle of the flow.
 */

import type { OrderStatus, Role } from '@metoo/shared'

/** Who may move an order into a given state. */
export type Actor = Extract<Role, 'BRAND' | 'ADMIN'>

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
  PENDING: [
    { to: 'CONFIRMED', label: 'Confirm Order', actors: ['BRAND', 'ADMIN'] },
    { to: 'CANCELLED', label: 'Cancel Order', actors: ['BRAND', 'ADMIN'] },
  ],
  CONFIRMED: [
    { to: 'PREPARING', label: 'Prepare Package', actors: ['BRAND', 'ADMIN'] },
    { to: 'CANCELLED', label: 'Cancel Order', actors: ['BRAND', 'ADMIN'] },
  ],
  PREPARING: [
    {
      to: 'READY_FOR_PICKUP',
      label: 'Mark Ready for Pickup',
      actors: ['BRAND', 'ADMIN'],
    },
    { to: 'CANCELLED', label: 'Cancel Order', actors: ['BRAND', 'ADMIN'] },
  ],
  READY_FOR_PICKUP: [
    { to: 'PICKED_UP', label: 'Confirm Pickup', actors: ['BRAND', 'ADMIN'] },
  ],
  // Once goods are with a courier, cancelling is a return, not a cancellation.
  PICKED_UP: [
    { to: 'DELIVERED', label: 'Mark Delivered', actors: ['BRAND', 'ADMIN'] },
  ],
  DELIVERED: [
    {
      to: 'SETTLED',
      label: 'Confirm Money Received',
      actors: ['BRAND', 'ADMIN'],
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
