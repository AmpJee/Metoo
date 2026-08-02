import { ORDER_STATUS_LABELS, type OrderStatus } from '@metoo/shared'

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
  { key: 'to-ship', label: 'To Ship', statuses: ['CONFIRMED', 'PREPARING'] },
  {
    key: 'to-receive',
    label: 'To Receive',
    statuses: ['READY_FOR_PICKUP', 'PICKED_UP'],
  },
  { key: 'completed', label: 'Completed', statuses: ['DELIVERED', 'SETTLED'] },
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

/** Badge tone per status — colour carries the same meaning as the label. */
export function statusTone(
  status: OrderStatus
): 'warning' | 'info' | 'success' | 'destructive' | 'default' {
  switch (status) {
    case 'PENDING':
      return 'warning'
    case 'CONFIRMED':
    case 'PREPARING':
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

export function statusLabel(status: OrderStatus) {
  return ORDER_STATUS_LABELS[status]
}

/** The seven logistics steps the tracker shows, in order. */
export const TRACKER_STEPS = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'PICKED_UP',
  'DELIVERED',
  'SETTLED',
] as const satisfies readonly OrderStatus[]
