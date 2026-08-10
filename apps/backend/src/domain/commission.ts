/**
 * Platform commission — pure, no Prisma, no I/O.
 *
 * The rate is tiered by category and by the brand's recent order volume, and it
 * is **snapshotted onto the order at checkout**. Nothing here ever recomputes a
 * rate for an existing order: a brand crossing the volume threshold next week
 * must not retroactively change what it earned last week.
 *
 * Rates are basis points (1 bp = 0.01%), so the arithmetic stays in integers.
 */

import type { Category } from '@metoo/shared'
import { COMMISSION_BPS, VOLUME_THRESHOLD } from '@metoo/shared'

// The rate card moved to @metoo/shared so the help centre can publish the
// same numbers it invoices. The logic stays here — nothing in a browser
// should be deciding what a brand earns. Re-exported because the checkout
// and the tests import them from this module.
export { VOLUME_THRESHOLD, VOLUME_WINDOW_DAYS } from '@metoo/shared'

/**
 * The rate a brand earns for one order, in basis points.
 *
 * `monthlyOrderCount` is that brand's order count over the trailing window,
 * measured *before* the order being created — so the thirtieth order still pays
 * the new-brand rate and the thirty-first is the first discounted one.
 */
export function resolveCommissionBps(
  category: Category,
  monthlyOrderCount: number
): number {
  const [newBrand, highVolume] = COMMISSION_BPS[category]
  return monthlyOrderCount >= VOLUME_THRESHOLD ? highVolume : newBrand
}

export interface AmountSplit {
  commissionMinor: number
  payoutMinor: number
}

/**
 * Split a subtotal into platform commission and brand payout.
 *
 * Payout is the remainder rather than a second multiplication, which
 * guarantees `commission + payout === subtotal` exactly. Computing both by
 * multiplication would let a rounded satang go missing, and money that
 * evaporates in rounding is money someone eventually has to explain.
 */
export function splitAmount(
  subtotalMinor: number,
  commissionBps: number
): AmountSplit {
  const commissionMinor = Math.round((subtotalMinor * commissionBps) / 10_000)
  return { commissionMinor, payoutMinor: subtotalMinor - commissionMinor }
}
