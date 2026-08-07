import {
  BUYER_ORDER_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from '@metoo/shared'
import type { Translate } from '@/lib/i18n'

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
  { key: 'all', label: 'All', statuses: null },
  { key: 'to-pay', label: 'To Pay', statuses: ['PENDING'] },
  { key: 'to-ship', label: 'To Ship', statuses: ['CONFIRMED'] },
  {
    key: 'to-receive',
    label: 'To Receive',
    statuses: ['READY_FOR_PICKUP', 'PICKED_UP', 'DELIVERED'],
  },
  // DELIVERED sits under To Receive, not Completed: the buyer still has
  // something to do there — confirm they got it — and an order they must act
  // on does not belong in a tab named for finished business.
  { key: 'completed', label: 'Completed', statuses: ['SETTLED'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['CANCELLED', 'CLOSED'] },
] as const satisfies readonly {
  key: string
  label: string
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

/** Seller and admin wording. Never use this in `app/(shop)/`. */
export function statusLabel(status: OrderStatus) {
  return ORDER_STATUS_LABELS[status]
}

/**
 * Buyer wording — "To Pay", "To Ship", "Completed".
 *
 * The shop and the consoles describe the same row differently on purpose; see
 * BUYER_ORDER_STATUS_LABELS in @metoo/shared for why.
 */
export function buyerStatusLabel(status: OrderStatus, t?: Translate) {
  // The translator is optional so the console — which stays English for now —
  // can keep calling this without one.
  return t ? t(`status.${status}`) : BUYER_ORDER_STATUS_LABELS[status]
}

/** An order the buyer still needs to pay for. */
export function awaitingPayment(status: OrderStatus) {
  return status === 'PENDING'
}

/** The six steps the seller and admin trackers show, in order. */
export const TRACKER_STEPS = [
  'PENDING',
  'CONFIRMED',
  'READY_FOR_PICKUP',
  'PICKED_UP',
  'DELIVERED',
  'SETTLED',
] as const satisfies readonly OrderStatus[]

/**
 * The five steps the BUYER's tracker shows.
 *
 * SETTLED is deliberately absent. To the retailer it is not a further stage of
 * their parcel — it is the button they press on step 5, and showing it as a
 * sixth dot would imply something still had to happen after they confirmed.
 */
export const BUYER_TRACKER_STEPS = [
  'PENDING',
  'CONFIRMED',
  'READY_FOR_PICKUP',
  'PICKED_UP',
  'DELIVERED',
] as const satisfies readonly OrderStatus[]

/** Is this the buyer's own move — confirming they received the goods? */
export function awaitingBuyerConfirmation(status: OrderStatus) {
  return status === 'DELIVERED'
}
