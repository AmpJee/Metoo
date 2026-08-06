/**
 * The seller's order tracker.
 *
 * Two things matter here beyond the usual ownership scoping:
 *
 *   1. **Transitions go through the domain state machine.** No handler decides
 *      what may follow what — `canTransition` does, and it is unit-tested with
 *      no database.
 *   2. **Every move writes an AuditLog row.** "Who marked this delivered, and
 *      when?" has to stay answerable, especially for the SETTLED step where a
 *      seller is asserting that money arrived.
 */
import { ORDER_STATUSES } from '@metoo/shared'
import type { OrderStatus, Prisma } from '../../generated/prisma/client.ts'
import { prisma } from '../../config/prisma.ts'
import { settlementEntries } from '../../domain/ledger.ts'
import type { Actor } from '../../domain/order-state.ts'
import {
  TIMESTAMP_FIELD,
  availableTransitions,
  canTransition,
} from '../../domain/order-state.ts'
import { AppError } from '../../middleware/error.ts'

/**
 * The retailer's contact details are included on purpose — a seller packing an
 * order needs to know where it is going and who to call. Nothing here exposes
 * the platform's commission arithmetic beyond this brand's own payout.
 */
const orderSelect = {
  id: true,
  orderNumber: true,
  status: true,
  subtotalMinor: true,
  totalMinor: true,
  payoutMinor: true,
  commissionBps: true,
  commissionMinor: true,
  paymentMethod: true,
  shippingAddress: true,
  confirmedAt: true,
  readyForPickupAt: true,
  pickedUpAt: true,
  deliveredAt: true,
  settledAt: true,
  createdAt: true,
  retailer: { select: { id: true, shopName: true, province: true } },
  items: {
    select: {
      id: true,
      productId: true,
      productName: true,
      pricePerPackMinor: true,
      unitsPerPack: true,
      packs: true,
      lineTotalMinor: true,
    },
  },
} satisfies Prisma.OrderSelect

/** Attaches the buttons the tracker should render for this order. */
function withActions<T extends { status: OrderStatus }>(order: T) {
  return { ...order, actions: availableTransitions(order.status, 'BRAND') }
}

export async function listForBrand(
  brandId: string,
  filter: { status?: OrderStatus }
) {
  const orders = await prisma.order.findMany({
    where: { brandId, status: filter.status },
    select: orderSelect,
    orderBy: { createdAt: 'desc' },
  })

  return orders.map(withActions)
}

/**
 * Counts per status, for the tab bar above the tracker.
 *
 * Every status is returned, zero included. The tab bar shows all of them, so
 * omitting the empty ones would just push an `?? 0` into the frontend.
 */
export async function countsForBrand(brandId: string) {
  const rows = await prisma.order.groupBy({
    by: ['status'],
    where: { brandId },
    _count: { _all: true },
  })

  const found = new Map(rows.map((row) => [row.status, row._count._all]))
  const byStatus = Object.fromEntries(
    ORDER_STATUSES.map((status) => [status, found.get(status) ?? 0])
  ) as Record<OrderStatus, number>

  return {
    all: rows.reduce((sum, row) => sum + row._count._all, 0),
    byStatus,
  }
}

export async function getForBrand(brandId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, brandId },
    select: orderSelect,
  })

  // Scoped by brandId, so another brand's id simply does not match — 404
  // rather than 403, which would confirm the order exists.
  if (!order) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'No such order.')
  }

  return withActions(order)
}

/**
 * Move an order to the next step.
 *
 * The actor is passed through to the state machine rather than assumed, so one
 * function serves the seller's Confirm Order, admin's logistics steps and the
 * retailer's Confirm Delivered.
 *
 * `brandId` and `retailerId` are ownership scopes, not authorisation: whoever
 * calls passes their own id so a mismatched order is a 404 rather than a 403,
 * which would confirm the order exists. Admin passes neither. What each role
 * may actually *do* is the state machine's decision, not this function's.
 */
export async function transition(params: {
  brandId?: string
  retailerId?: string
  orderId: string
  to: OrderStatus
  actor: Actor
  actorUserId: string
}) {
  const { brandId, retailerId, orderId, to, actor, actorUserId } = params

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      ...(brandId ? { brandId } : {}),
      ...(retailerId ? { retailerId } : {}),
    },
    select: {
      id: true,
      status: true,
      brandId: true,
      subtotalMinor: true,
      commissionMinor: true,
    },
  })

  if (!order) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'No such order.')
  }

  const check = canTransition(order.status, to, actor)
  if (!check.ok) {
    throw new AppError(422, check.code, check.message)
  }

  const stamp = TIMESTAMP_FIELD[to]

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.order.update({
      where: { id: order.id },
      data: {
        status: to,
        ...(stamp ? { [stamp]: new Date() } : {}),
      },
      select: orderSelect,
    })

    // SETTLED is the moment the sale reaches the brand's wallet. Writing the
    // ledger rows in the same transaction as the status change is what stops
    // an order ever being settled without being credited, or credited twice.
    //
    // The state machine already refuses to leave SETTLED, so this cannot run
    // for the same order more than once.
    if (to === 'SETTLED') {
      await tx.walletTransaction.createMany({
        data: settlementEntries(order).map((entry) => ({
          brandId: order.brandId,
          orderId: order.id,
          type: entry.type,
          amountMinor: entry.amountMinor,
        })),
      })
    }

    await tx.auditLog.create({
      data: {
        actorId: actorUserId,
        action: `ORDER_${to}`,
        entityType: 'Order',
        entityId: order.id,
        metadata: { from: order.status, to, actor },
      },
    })

    return row
  })

  return withActions(updated)
}
