import type { Category } from './types/user.ts'

/**
 * What metoo takes, per category — the rate card itself.
 *
 * Only the table lives here, not the logic: `resolveCommissionBps` and the
 * split arithmetic stay in the backend's domain layer, because nothing in the
 * browser should be computing what a brand earns. What the browser does need
 * is to *quote* the rates — the help centre publishes them — and a second copy
 * typed into a help page is a copy that eventually contradicts the invoice.
 *
 * Basis points (1 bp = 0.01%), so the arithmetic stays in integers.
 */

/**
 * [new brand, high volume] in basis points.
 *
 * The first three come from the product brief. Fashion & Accessories appears
 * only in the design and was set to match Health & Beauty — both are
 * discretionary, higher-margin goods rather than the staples a minimart
 * restocks weekly.
 */
export const COMMISSION_BPS: Record<Category, readonly [number, number]> = {
  FOOD_BEVERAGE: [400, 200], // 4% / 2%
  HEALTH_BEAUTY: [800, 500], // 8% / 5%
  HOME_LIVING: [500, 300], // 5% / 3%
  FASHION_ACCESSORIES: [800, 500], // 8% / 5%
}

/** Orders in the trailing month at which a brand moves to the lower rate. */
export const VOLUME_THRESHOLD = 30

/** Days counted as "the trailing month" when measuring volume. */
export const VOLUME_WINDOW_DAYS = 30
