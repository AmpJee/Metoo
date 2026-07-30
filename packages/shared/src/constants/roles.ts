/**
 * The three account roles.
 *
 * Values must stay identical to the `Role` enum in
 * `apps/backend/prisma/schema.prisma`; Prisma enums are strings on the wire.
 */
export const ROLES = ['ADMIN', 'BRAND', 'RETAILER'] as const

/**
 * Brand and retailer signups need manual admin approval before the account
 * goes live.
 *
 * RESUBMIT_REQUIRED is the important one: a rejected applicant is sent back to
 * fix their documents rather than being dead-ended, so REJECTED is reserved
 * for a final refusal.
 *
 * Must stay identical to the `AccountStatus` enum in the Prisma schema.
 */
export const ACCOUNT_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'RESUBMIT_REQUIRED',
] as const

/**
 * Product categories. Each carries its own commission tier — see the rates
 * table in CLAUDE.md. Must match the `Category` enum in the Prisma schema.
 */
export const CATEGORIES = [
  'FOOD_BEVERAGE',
  'HEALTH_BEAUTY',
  'HOME_LIVING',
  'FASHION_ACCESSORIES',
] as const

/**
 * Order lifecycle.
 *
 * SETTLED is financial rather than logistical: it means the sale was credited
 * to the brand's wallet ledger. CANCELLED and CLOSED are terminal, CLOSED
 * being where an order lands once a return has been resolved.
 *
 * Must match the `OrderStatus` enum in the Prisma schema.
 */
export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'PICKED_UP',
  'DELIVERED',
  'SETTLED',
  'CANCELLED',
  'CLOSED',
] as const

/**
 * The labels the seller's order tracker shows. Kept beside the enum so a new
 * state cannot be added without deciding what a human calls it.
 */
export const ORDER_STATUS_LABELS: Record<
  (typeof ORDER_STATUSES)[number],
  string
> = {
  PENDING: 'Incoming',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY_FOR_PICKUP: 'Ready for Pickup',
  PICKED_UP: 'Picked Up',
  DELIVERED: 'Delivered',
  SETTLED: 'Money Received',
  CANCELLED: 'Cancelled',
  CLOSED: 'Closed',
}
