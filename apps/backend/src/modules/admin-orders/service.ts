/**
 * Admin oversight of every order on the platform.
 *
 * Unlike the brand and retailer views, this one shows both sides and the full
 * commission arithmetic — it is the table the operations team runs the
 * business from.
 *
 * Transitions reuse the brand order service so there is exactly one
 * implementation of "move an order", differing only in the actor passed to the
 * state machine.
 */
import type { OrderStatus, Prisma } from '../../generated/prisma/client.ts'
import { prisma } from '../../config/prisma.ts'
import {
  EARNS_REVENUE,
  availableTransitions,
} from '../../domain/order-state.ts'
import { createDocumentReadUrl } from '../../lib/supabase.ts'
import { AppError } from '../../middleware/error.ts'

const adminOrderSelect = {
  id: true,
  // Scalar as well as the relation: the derived columns key on it in memory.
  retailerId: true,
  orderNumber: true,
  status: true,
  subtotalMinor: true,
  totalMinor: true,
  commissionBps: true,
  commissionMinor: true,
  payoutMinor: true,
  deliveryCostMinor: true,
  paymentMethod: true,
  // Whether a slip has arrived, not the slip itself — the table shows a
  // marker so an admin can see at a glance which PENDING orders are waiting
  // on them rather than on the buyer. Reading the file is its own request.
  paymentSlipAt: true,
  paymentConfirmedAt: true,
  confirmedAt: true,
  deliveredAt: true,
  settledAt: true,
  createdAt: true,
  brand: { select: { id: true, name: true } },
  retailer: { select: { id: true, shopName: true, province: true } },
  items: {
    select: { productName: true, packs: true, lineTotalMinor: true },
  },
} satisfies Prisma.OrderSelect

/**
 * The three derived columns the Orders table shows: "Signup→1st order",
 * "Fulfillment" and "Repeat?".
 *
 * Computed here rather than in the frontend because two of them need the
 * retailer's whole order history, not just the row being rendered. One extra
 * query for the page, then everything is in memory — a per-row lookup would be
 * an N+1 on the busiest admin screen.
 */
async function decorate<
  T extends {
    id: string
    retailerId: string
    createdAt: Date
    deliveredAt: Date | null
  },
>(orders: T[]) {
  if (orders.length === 0) return []

  const retailerIds = [...new Set(orders.map((o) => o.retailerId))]

  const [retailers, history] = await Promise.all([
    prisma.retailerProfile.findMany({
      where: { id: { in: retailerIds } },
      select: { id: true, user: { select: { createdAt: true } } },
    }),
    // Every counted order for these retailers, oldest first, so "is this their
    // first?" and "when was their first?" are both answerable in memory.
    prisma.order.findMany({
      where: {
        retailerId: { in: retailerIds },
        status: { in: [...EARNS_REVENUE] },
      },
      select: { id: true, retailerId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const signupAt = new Map(retailers.map((r) => [r.id, r.user.createdAt]))
  const firstOrder = new Map<string, { id: string; createdAt: Date }>()
  for (const order of history) {
    if (!firstOrder.has(order.retailerId))
      firstOrder.set(order.retailerId, order)
  }

  const HOUR = 1000 * 60 * 60

  return orders.map((order) => {
    const first = firstOrder.get(order.retailerId)
    const isFirst = first?.id === order.id
    const signup = signupAt.get(order.retailerId)

    return {
      ...order,
      /**
       * Only on a retailer's first order — the design shows "—" on the rest,
       * because the number is about acquisition, not about this order.
       */
      signupToFirstOrderDays:
        isFirst && signup
          ? Math.max(
              0,
              Math.round(
                (order.createdAt.getTime() - signup.getTime()) / (HOUR * 24)
              )
            )
          : null,
      /** Null until delivered; an undelivered order has no duration yet. */
      fulfilmentHours: order.deliveredAt
        ? Math.max(
            0,
            Math.round(
              (order.deliveredAt.getTime() - order.createdAt.getTime()) / HOUR
            )
          )
        : null,
      /** False on a retailer's first counted order, true on every one after. */
      isRepeat: Boolean(first) && !isFirst,
    }
  })
}

/**
 * Attach the moves an admin may make from here.
 *
 * Same contract as the brand view: the console renders whatever buttons this
 * returns, so the state machine in domain/order-state.ts stays the single
 * source of truth instead of being restated in the frontend. ADMIN sees a
 * superset of BRAND's moves.
 */
function withActions<T extends { status: OrderStatus }>(order: T) {
  return { ...order, actions: availableTransitions(order.status, 'ADMIN') }
}

export async function listAll(filter: {
  status?: OrderStatus
  brandId?: string
  retailerId?: string
  q?: string
}) {
  const q = filter.q?.trim()
  const like = q ? { contains: q, mode: 'insensitive' as const } : undefined

  const orders = await prisma.order.findMany({
    where: {
      status: filter.status,
      brandId: filter.brandId,
      retailerId: filter.retailerId,
      // The console's search box: order number, brand or shop.
      ...(like
        ? {
            OR: [
              { orderNumber: like },
              { brand: { is: { name: like } } },
              { retailer: { is: { shopName: like } } },
            ],
          }
        : {}),
    },
    select: adminOrderSelect,
    orderBy: { createdAt: 'desc' },
  })

  // decorate first — it needs the whole page at once to answer "is this their
  // first order?" — then withActions per row.
  return (await decorate(orders)).map(withActions)
}

export async function getById(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: adminOrderSelect,
  })

  if (!order) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'No such order.')
  }

  return withActions((await decorate([order]))[0]!)
}

/**
 * A short-lived link to the buyer's transfer slip.
 *
 * Signed on demand rather than stored as a URL, for the same reason
 * verification documents are: the slip shows a bank account number and a
 * name, and access to it has to stay revocable. The link is minted per
 * request and expires on its own.
 */
export async function getPaymentSlipUrl(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { paymentSlipKey: true, paymentSlipAt: true },
  })

  if (!order) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'No such order.')
  }

  if (!order.paymentSlipKey) {
    throw new AppError(
      404,
      'NO_PAYMENT_SLIP',
      'The buyer has not sent a transfer slip for this order.'
    )
  }

  return {
    url: await createDocumentReadUrl(order.paymentSlipKey),
    uploadedAt: order.paymentSlipAt,
  }
}

/**
 * Record what logistics actually cost the platform for this order.
 *
 * Admin enters it after the fact — a courier invoice arrives days later — and
 * it feeds the contribution-margin figure on the dashboard.
 */
export async function setDeliveryCost(params: {
  adminId: string
  orderId: string
  deliveryCostMinor: number
}) {
  const { adminId, orderId, deliveryCostMinor } = params

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, deliveryCostMinor: true },
  })

  if (!existing) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'No such order.')
  }

  return prisma.$transaction(async (tx) => {
    const row = await tx.order.update({
      where: { id: orderId },
      data: { deliveryCostMinor },
      select: adminOrderSelect,
    })

    // Decorated like every other read of this shape, so the response the table
    // re-renders from has the same columns the list gave it.
    const [decorated] = await decorate([row])

    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: 'ORDER_DELIVERY_COST_SET',
        entityType: 'Order',
        entityId: orderId,
        metadata: {
          from: existing.deliveryCostMinor,
          to: deliveryCostMinor,
        },
      },
    })

    return withActions(decorated!)
  })
}
