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

/** Orders in the trailing month at which a brand moves to the lower rate. */
export const VOLUME_THRESHOLD = 30

/** Days counted as "the trailing month" when measuring volume. */
export const VOLUME_WINDOW_DAYS = 30

/**
 * [new brand, high volume] in basis points.
 *
 * The first three come from the product brief. Fashion & Accessories appears
 * only in the design and was set to match Health & Beauty — both are
 * discretionary, higher-margin goods rather than the staples a minimart
 * restocks weekly.
 */
const RATES: Record<Category, readonly [number, number]> = {
  FOOD_BEVERAGE: [400, 200], // 4% / 2%
  HEALTH_BEAUTY: [800, 500], // 8% / 5%
  HOME_LIVING: [500, 300], // 5% / 3%
  FASHION_ACCESSORIES: [800, 500], // 8% / 5%
}

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
  const [newBrand, highVolume] = RATES[category]
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
