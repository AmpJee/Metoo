/**
 * Retailer order views.
 *
 * Almost read-only. The retailer owns exactly one move — confirming a
 * DELIVERED order, which settles it and releases the brand's money. Everything
 * before that is the brand's acceptance and admin's logistics.
 *
 * Every query is scoped to the calling retailer, and someone else's order id
 * reports 404 rather than 403, matching the rule products already follow: a 403
 * confirms the id is real.
 */
import type { OrderStatus, Prisma } from '../../generated/prisma/client.ts'
import { prisma } from '../../config/prisma.ts'
import { AppError } from '../../middleware/error.ts'
import { transition } from '../brand-orders/service.ts'

/**
 * Commission is deliberately absent.
 *
 * commissionBps, commissionMinor and payoutMinor are the platform's
 * arrangement with the brand. A retailer pays the total either way and has no
 * business seeing what cut the brand gives up.
 */
const orderSelect = {
  id: true,
  orderNumber: true,
  checkoutGroupId: true,
  status: true,
  subtotalMinor: true,
  shippingMinor: true,
  totalMinor: true,
  shippingAddress: true,
  confirmedAt: true,
  pickedUpAt: true,
  deliveredAt: true,
  createdAt: true,
  brand: { select: { id: true, name: true, logoUrl: true } },
  items: {
    select: {
      id: true,
      productId: true,
      productName: true,
      pricePerPackMinor: true,
      packs: true,
      lineTotalMinor: true,
    },
  },
} satisfies Prisma.OrderSelect

export function listForRetailer(
  retailerId: string,
  filter: { status?: OrderStatus }
) {
  return prisma.order.findMany({
    where: { retailerId, status: filter.status },
    select: orderSelect,
    orderBy: { createdAt: 'desc' },
  })
}

export async function getForRetailer(retailerId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, retailerId },
    select: orderSelect,
  })

  if (!order) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'No such order.')
  }

  return order
}

/**
 * The retailer confirms they received the goods.
 *
 * This is step 5 -> 6, and it is the step that writes the brand's wallet
 * credit. Delegating to the shared `transition` rather than updating the row
 * here is what guarantees the ledger rows are written in the same transaction
 * as the status change — the settlement logic exists once, not once per
 * caller.
 *
 * The state machine rejects this on any status other than DELIVERED, so a
 * retailer cannot settle an order that has not arrived.
 */
export async function confirmDelivered(params: {
  retailerId: string
  userId: string
  orderId: string
}) {
  await transition({
    retailerId: params.retailerId,
    orderId: params.orderId,
    to: 'SETTLED',
    actor: 'RETAILER',
    actorUserId: params.userId,
  })

  // Re-read through the retailer's own select: `transition` returns the
  // seller's shape, which carries the commission fields a buyer must not see.
  return getForRetailer(params.retailerId, params.orderId)
}

/**
 * Every order created by one checkout.
 *
 * The confirmation screen needs all N at once — a retailer who checked out a
 * three-brand basket thinks of it as one purchase, even though it became three
 * independently payable orders.
 */
export async function getGroupForRetailer(
  retailerId: string,
  checkoutGroupId: string
) {
  const orders = await prisma.order.findMany({
    where: { checkoutGroupId, retailerId },
    select: orderSelect,
    orderBy: { createdAt: 'asc' },
  })

  if (orders.length === 0) {
    throw new AppError(404, 'ORDER_GROUP_NOT_FOUND', 'No such checkout.')
  }

  return {
    checkoutGroupId,
    orderCount: orders.length,
    totalMinor: orders.reduce((sum, order) => sum + order.totalMinor, 0),
    orders,
  }
}
