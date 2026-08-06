/**
 * Returns — pure, no Prisma, no I/O.
 *
 * Three rules from the product brief:
 *
 *   1. **Post-delivery only.** A retailer cannot return goods they have not
 *      received, so DELIVERED or SETTLED is a precondition.
 *   2. **Seller or admin reviews it.** Accepted means a refund; rejected means
 *      the order stands as delivered.
 *   3. **Accepted closes the order.** Rejected leaves it exactly where it was.
 */

import type { OrderStatus } from '@metoo/shared'
import type { LedgerEntry } from './ledger.ts'

/** The states in which goods are with the retailer. */
const RECEIVED: OrderStatus[] = ['DELIVERED', 'SETTLED']

export type ReturnCheck =
  { ok: true } | { ok: false; code: string; message: string }

/**
 * May a return be raised against this order?
 *
 * `hasExistingRequest` covers the one-per-order rule the schema enforces with
 * a unique index — checking here turns a database constraint violation into a
 * message the retailer can act on.
 */
export function canRequestReturn(
  status: OrderStatus,
  hasExistingRequest: boolean
): ReturnCheck {
  if (hasExistingRequest) {
    return {
      ok: false,
      code: 'RETURN_ALREADY_REQUESTED',
      message: 'A return has already been raised for this order.',
    }
  }

  if (!RECEIVED.includes(status)) {
    return {
      ok: false,
      code: 'RETURN_BEFORE_DELIVERY',
      message:
        status === 'CANCELLED' || status === 'CLOSED'
          ? 'This order is closed.'
          : 'A return can only be raised once the order has been delivered.',
    }
  }

  return { ok: true }
}

/** Only an open request can be decided, and only once. */
export function canReviewReturn(
  status: 'REQUESTED' | 'ACCEPTED' | 'REJECTED'
): ReturnCheck {
  if (status !== 'REQUESTED') {
    return {
      ok: false,
      code: 'RETURN_ALREADY_REVIEWED',
      message: `This return has already been ${status.toLowerCase()}.`,
    }
  }

  return { ok: true }
}

/**
 * The ledger rows to write when a return is accepted.
 *
 * Only an order that reached SETTLED ever credited the brand's wallet. One
 * still at DELIVERED was never paid out, so accepting a return on it simply
 * means it never will be — there is nothing to unwind, and writing a debit
 * would push the balance negative for money the brand never had.
 *
 * The debit is `payoutMinor`, not the order total: the brand returns exactly
 * what it received. The platform's commission is its own to refund or absorb,
 * and does not belong in the brand's ledger.
 */
export function refundEntries(order: {
  status: OrderStatus
  payoutMinor: number
}): LedgerEntry[] {
  if (order.status !== 'SETTLED') return []

  return [{ type: 'REFUND_DEBIT', amountMinor: -order.payoutMinor }]
}

/**
 * Where the order lands once the return is decided.
 *
 * Accepted closes it. Rejected leaves it exactly where it was — the brief's
 * "order stays closed as delivered" means the delivery stands, not that the
 * order moves to a new state.
 */
export function statusAfterReview(
  current: OrderStatus,
  decision: 'ACCEPTED' | 'REJECTED'
): OrderStatus {
  return decision === 'ACCEPTED' ? 'CLOSED' : current
}
