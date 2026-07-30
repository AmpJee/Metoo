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
import { AppError } from '../../middleware/error.ts'

const adminOrderSelect = {
  id: true,
  orderNumber: true,
  status: true,
  subtotalMinor: true,
  totalMinor: true,
  commissionBps: true,
  commissionMinor: true,
  payoutMinor: true,
  deliveryCostMinor: true,
  paymentMethod: true,
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

export async function listAll(filter: {
  status?: OrderStatus
  brandId?: string
  retailerId?: string
}) {
  return prisma.order.findMany({
    where: {
      status: filter.status,
      brandId: filter.brandId,
      retailerId: filter.retailerId,
    },
    select: adminOrderSelect,
    orderBy: { createdAt: 'desc' },
  })
}

export async function getById(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: adminOrderSelect,
  })

  if (!order) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'No such order.')
  }

  return order
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

    return row
  })
}
