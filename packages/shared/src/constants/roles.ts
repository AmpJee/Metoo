/**
 * The three account roles.
 *
 * Values must stay identical to the `Role` enum in
 * `apps/backend/prisma/schema.prisma`; Prisma enums are strings on the wire.
 */
export const ROLES = ['ADMIN', 'BRAND', 'RETAILER'] as const

/**
 * Where an account sits in the sales pipeline the admin console tracks.
 *
 * This doubles as the authorisation gate: only ONBOARDED accounts can trade.
 * A self-registered applicant starts at NOT_CONTACTED and admin walks them
 * forward.
 *
 * Must stay identical to the `PipelineStatus` enum in the Prisma schema.
 */
export const PIPELINE_STATUSES = [
  'NOT_CONTACTED',
  'CONTACTED',
  'INTERESTED',
  'ONBOARDED',
  'DECLINED',
] as const

/** The one status that grants access to trading features. */
export const TRADING_STATUS = 'ONBOARDED'

/** อย. (Thai FDA) certification state, shown as its own admin column. */
export const FDA_STATUSES = ['YES', 'PENDING', 'NO'] as const

export const SIZE_BANDS = [
  'SIZE_1_5',
  'SIZE_6_20',
  'SIZE_21_50',
  'SIZE_51_PLUS',
] as const

export const SHOP_TYPES = [
  'MINIMART',
  'SUNDRIES',
  'SPECIALTY',
  'MARKET_STALL',
] as const

export const PAYMENT_PREFERENCES = ['PROMPTPAY', 'CASH', 'CARD'] as const

export const PAYMENT_RELIABILITIES = ['ON_TIME', 'PENDING', 'LATE'] as const

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
 * How each category is written in the interface. Kept beside the enum for the
 * same reason as ORDER_STATUS_LABELS: a new category cannot be added without
 * deciding what a shopper calls it.
 */
export const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  FOOD_BEVERAGE: 'Food & Beverage',
  HEALTH_BEAUTY: 'Health & Beauty',
  HOME_LIVING: 'Home & Living',
  FASHION_ACCESSORIES: 'Fashion & Accessories',
}

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
