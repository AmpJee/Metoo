/**
 * Loading the order rows the analytics functions consume.
 *
 * Both dashboards need the same six columns over the same filter, and they
 * must arrive **oldest first** — `repeatOrderRate` decides which of a
 * retailer's orders was their first by position, so a descending sort would
 * silently invert the metric.
 *
 * That ordering is the reason this is one function rather than a shared
 * `select` constant: a constant leaves each caller to remember the `orderBy`,
 * and forgetting it produces a plausible-looking wrong number rather than an
 * error.
 */
import type { OrderFact } from '../domain/analytics.ts'
import { EARNS_REVENUE } from '../domain/order-state.ts'
import { prisma } from '../config/prisma.ts'

export function loadOrderFacts(filter: {
  brandId?: string
  since: Date
}): Promise<OrderFact[]> {
  return prisma.order.findMany({
    where: {
      brandId: filter.brandId,
      status: { in: [...EARNS_REVENUE] },
      createdAt: { gte: filter.since },
    },
    select: {
      createdAt: true,
      subtotalMinor: true,
      commissionMinor: true,
      deliveryCostMinor: true,
      retailerId: true,
      deliveredAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })
}
