import {
  BUYER_ORDER_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from '@metoo/shared'
import type { MessageKey, Translate } from '@/lib/i18n'

/**
 * The "My Purchase" tabs.
 *
 * The design's five tabs do not map one-to-one onto the nine order states, so
 * each tab owns a set. Keeping the mapping here — rather than inline in the
 * page — means the tab counts and the filtered list can never disagree.
 *
 * Return Refund is deliberately absent: returns are their own resource
 * (/returns), not an order status.
 */
export const PURCHASE_TABS = [
  { key: 'all', labelKey: 'orders.tab.all', statuses: null },
  { key: 'to-pay', labelKey: 'orders.tab.toPay', statuses: ['PENDING'] },
  {
    key: 'to-ship',
    labelKey: 'orders.tab.toShip',
    // PAYMENT_CONFIRMED belongs here, not under To Pay: the buyer's money has
    // arrived and there is nothing left for them to do but wait for the brand
    // to accept. Leaving it in To Pay would ask them to pay twice.
    statuses: ['PAYMENT_CONFIRMED', 'CONFIRMED'],
  },
  {
    key: 'to-receive',
    labelKey: 'orders.tab.toReceive',
    statuses: ['READY_FOR_PICKUP', 'PICKED_UP', 'DELIVERED'],
  },
  // DELIVERED sits under To Receive, not Completed: the buyer still has
  // something to do there — confirm they got it — and an order they must act
  // on does not belong in a tab named for finished business.
  { key: 'completed', labelKey: 'orders.tab.completed', statuses: ['SETTLED'] },
  {
    key: 'cancelled',
    labelKey: 'orders.tab.cancelled',
    statuses: ['CANCELLED', 'CLOSED'],
  },
] as const satisfies readonly {
  key: string
  labelKey: MessageKey
  statuses: readonly OrderStatus[] | null
}[]

export type PurchaseTabKey = (typeof PURCHASE_TABS)[number]['key']

export function tabFor(key: string | undefined) {
  return PURCHASE_TABS.find((tab) => tab.key === key) ?? PURCHASE_TABS[0]
}

/**
 * Console pill tone per status.
 *
 * Separate from `statusTone` because the two design systems name their tones
 * differently — the buyer's Badge has `destructive`/`default`, the console's
 * Pill has `danger`/`neutral`. Same meaning, mapped once here rather than
 * translated at every call site.
 */
export function statusPillTone(
  status: OrderStatus
): 'warning' | 'info' | 'success' | 'danger' | 'neutral' {
  const tone = statusTone(status)
  if (tone === 'destructive') return 'danger'
  if (tone === 'default') return 'neutral'
  return tone
}

/** Badge tone per status — colour carries the same meaning as the label. */
export function statusTone(
  status: OrderStatus
): 'warning' | 'info' | 'success' | 'destructive' | 'default' {
  switch (status) {
    case 'PENDING':
      return 'warning'
    case 'PAYMENT_CONFIRMED':
    case 'CONFIRMED':
    case 'READY_FOR_PICKUP':
    case 'PICKED_UP':
      return 'info'
    case 'DELIVERED':
    case 'SETTLED':
      return 'success'
    case 'CANCELLED':
      return 'destructive'
    case 'CLOSED':
      return 'default'
  }
}

/**
 * Seller and admin wording. Never use this in `app/(shop)/`.
 *
 * `orderStatus.*` rather than `status.*` — the console reads PENDING as work
 * arriving ("ออร์เดอร์ใหม่") where the buyer reads it as money owed
 * ("รอชำระเงิน"). Two namespaces, same nine states.
 */
export function statusLabel(status: OrderStatus, t?: Translate) {
  return t ? t(`orderStatus.${status}`) : ORDER_STATUS_LABELS[status]
}

/**
 * Buyer wording — "To Pay", "To Ship", "Completed".
 *
 * The shop and the consoles describe the same row differently on purpose; see
 * BUYER_ORDER_STATUS_LABELS in @metoo/shared for why.
 */
export function buyerStatusLabel(status: OrderStatus, t?: Translate) {
  // The translator stays optional in both helpers: the shared English map is
  // the fallback for any call site not yet converted, so a missed one renders
  // English rather than a raw key.
  return t ? t(`status.${status}`) : BUYER_ORDER_STATUS_LABELS[status]
}

/** An order the buyer still needs to pay for. */
export function awaitingPayment(status: OrderStatus) {
  return status === 'PENDING'
}

/** The seven steps the seller and admin trackers show, in order. */
export const TRACKER_STEPS = [
  'PENDING',
  'PAYMENT_CONFIRMED',
  'CONFIRMED',
  'READY_FOR_PICKUP',
  'PICKED_UP',
  'DELIVERED',
  'SETTLED',
] as const satisfies readonly OrderStatus[]

/**
 * The six steps the BUYER's tracker shows.
 *
 * SETTLED is deliberately absent. To the retailer it is not a further stage of
 * their parcel — it is the button they press on step 5, and showing it as a
 * seventh dot would imply something still had to happen after they confirmed.
 */
export const BUYER_TRACKER_STEPS = [
  'PENDING',
  'PAYMENT_CONFIRMED',
  'CONFIRMED',
  'READY_FOR_PICKUP',
  'PICKED_UP',
  'DELIVERED',
] as const satisfies readonly OrderStatus[]

/** Is this the buyer's own move — confirming they received the goods? */
export function awaitingBuyerConfirmation(status: OrderStatus) {
  return status === 'DELIVERED'
}
