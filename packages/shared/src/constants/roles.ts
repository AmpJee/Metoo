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

/**
 * Pipeline stages as the admin console writes them. Beside the enum for the
 * same reason as every other label map here: a stage cannot be added without
 * deciding what an operator calls it.
 */
export const PIPELINE_STATUS_LABELS: Record<
  (typeof PIPELINE_STATUSES)[number],
  string
> = {
  NOT_CONTACTED: 'Not Contacted',
  CONTACTED: 'Contacted',
  INTERESTED: 'Interested',
  ONBOARDED: 'Onboarded',
  DECLINED: 'Declined',
}

/** อย. (Thai FDA) certification state, shown as its own admin column. */
export const FDA_STATUSES = ['YES', 'PENDING', 'NO'] as const

export const FDA_STATUS_LABELS: Record<(typeof FDA_STATUSES)[number], string> =
  {
    YES: 'Certified',
    PENDING: 'Pending',
    NO: 'None',
  }

export const SIZE_BANDS = [
  'SIZE_1_5',
  'SIZE_6_20',
  'SIZE_21_50',
  'SIZE_51_PLUS',
] as const

/** Headcount bands, written as ranges rather than enum names. */
export const SIZE_BAND_LABELS: Record<(typeof SIZE_BANDS)[number], string> = {
  SIZE_1_5: '1–5 people',
  SIZE_6_20: '6–20 people',
  SIZE_21_50: '21–50 people',
  SIZE_51_PLUS: '51+ people',
}

export const SHOP_TYPES = [
  'MINIMART',
  'SUNDRIES',
  'SPECIALTY',
  'MARKET_STALL',
] as const

export const SHOP_TYPE_LABELS: Record<(typeof SHOP_TYPES)[number], string> = {
  MINIMART: 'Minimart',
  SUNDRIES: 'Sundries',
  SPECIALTY: 'Specialty',
  MARKET_STALL: 'Market stall',
}

export const PAYMENT_PREFERENCES = ['PROMPTPAY', 'CASH', 'CARD'] as const

export const PAYMENT_PREFERENCE_LABELS: Record<
  (typeof PAYMENT_PREFERENCES)[number],
  string
> = {
  PROMPTPAY: 'PromptPay',
  CASH: 'Cash on delivery',
  CARD: 'Card',
}

export const PAYMENT_RELIABILITIES = ['ON_TIME', 'PENDING', 'LATE'] as const

export const PAYMENT_RELIABILITY_LABELS: Record<
  (typeof PAYMENT_RELIABILITIES)[number],
  string
> = {
  ON_TIME: 'On time',
  PENDING: 'Pending',
  LATE: 'Late',
}

/** Where a brand's withdrawal request sits. */
export const WITHDRAWAL_STATUSES = [
  'REQUESTED',
  'APPROVED',
  'REJECTED',
  'PAID',
] as const

export const WITHDRAWAL_STATUS_LABELS: Record<
  (typeof WITHDRAWAL_STATUSES)[number],
  string
> = {
  REQUESTED: 'Requested',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PAID: 'Paid',
}

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
 * Order lifecycle — seven steps.
 *
 *   1 PENDING            To pay
 *   2 PAYMENT_CONFIRMED  Payment received     <- ADMIN confirms the transfer
 *   3 CONFIRMED          Confirmed order      <- the brand accepts
 *   4 READY_FOR_PICKUP   Package pickup
 *   5 PICKED_UP          Out for delivery
 *   6 DELIVERED          Delivered
 *   7 SETTLED            Confirm delivered    <- releases the brand's money
 *
 * PAYMENT_CONFIRMED exists because payment is a manual bank transfer: nobody
 * but an admin can see the money arrive, and a brand should not be packing
 * goods against a transfer that has not landed.
 *
 * SETTLED is financial rather than logistical: it means the sale was credited
 * to the brand's wallet ledger. CANCELLED and CLOSED are terminal, CLOSED
 * being where an order lands once a return has been resolved.
 *
 * There is no PREPARING. It was a seventh step between CONFIRMED and
 * READY_FOR_PICKUP that nobody operated — packing is not a milestone either
 * side tracks, and it left the buyer looking at two states that mean the same
 * thing to them.
 *
 * Must match the `OrderStatus` enum in the Prisma schema.
 */
export const ORDER_STATUSES = [
  'PENDING',
  'PAYMENT_CONFIRMED',
  'CONFIRMED',
  'READY_FOR_PICKUP',
  'PICKED_UP',
  'DELIVERED',
  'SETTLED',
  'CANCELLED',
  'CLOSED',
] as const

/**
 * The labels the SELLER and ADMIN consoles show. Kept beside the enum so a new
 * state cannot be added without deciding what a human calls it.
 *
 * These are written from the seller's side of the transaction — a new order is
 * work arriving ("Incoming"), and SETTLED is the moment their money lands.
 */
export const ORDER_STATUS_LABELS: Record<
  (typeof ORDER_STATUSES)[number],
  string
> = {
  PENDING: 'Awaiting payment',
  PAYMENT_CONFIRMED: 'Paid — to accept',
  CONFIRMED: 'Confirmed',
  READY_FOR_PICKUP: 'Package Pickup',
  PICKED_UP: 'Out for Delivery',
  DELIVERED: 'Delivered',
  SETTLED: 'Money Received',
  CANCELLED: 'Cancelled',
  CLOSED: 'Closed',
}

/**
 * The same eight states, written for the BUYER.
 *
 * A second map rather than a rename, because the two sides genuinely mean
 * different things by the same row. PENDING is "Incoming" work to a seller and
 * "To Pay" to a shopper. SETTLED is the seller's payday, and to the buyer it
 * is the receipt they confirmed — so it reads as Completed, which is also how
 * the My Purchase tabs already group it.
 *
 * Use `buyerStatusLabel()` in the shop; never `ORDER_STATUS_LABELS`.
 */
export const BUYER_ORDER_STATUS_LABELS: Record<
  (typeof ORDER_STATUSES)[number],
  string
> = {
  PENDING: 'To Pay',
  PAYMENT_CONFIRMED: 'Payment received',
  CONFIRMED: 'Confirmed',
  READY_FOR_PICKUP: 'Package Pickup',
  PICKED_UP: 'Out for Delivery',
  DELIVERED: 'Delivered',
  SETTLED: 'Completed',
  CANCELLED: 'Cancelled',
  CLOSED: 'Closed',
}
