/**
 * The seller's Customers list.
 *
 * Derived entirely from orders — there is no Customer model, and there should
 * not be one. A customer *is* "a retailer who has ordered from this brand", so
 * storing it separately would create a second source of truth that drifts the
 * first time an order is cancelled.
 */
import { prisma } from '../../config/prisma.ts'
import { EARNS_REVENUE } from '../../domain/order-state.ts'

/**
 * Retailers who have bought from this brand, with their totals.
 *
 * Only orders that count as revenue — a PENDING order is a request, and a
 * retailer whose single order was cancelled is not a customer.
 *
 * Sorted by spend rather than recency: the question this screen answers is
 * "who matters", not "who is newest".
 */
export async function listForBrand(brandId: string) {
  const grouped = await prisma.order.groupBy({
    by: ['retailerId'],
    where: { brandId, status: { in: [...EARNS_REVENUE] } },
    _count: { _all: true },
    _sum: { subtotalMinor: true },
    _max: { createdAt: true },
    _min: { createdAt: true },
    orderBy: { _sum: { subtotalMinor: 'desc' } },
  })

  if (grouped.length === 0) return []

  // One query for every retailer on the page rather than one each.
  const retailers = await prisma.retailerProfile.findMany({
    where: { id: { in: grouped.map((row) => row.retailerId) } },
    select: {
      id: true,
      shopName: true,
      shopType: true,
      province: true,
      zone: true,
      phone: true,
    },
  })

  const byId = new Map(retailers.map((r) => [r.id, r]))

  return grouped.flatMap((row) => {
    const retailer = byId.get(row.retailerId)
    // A deleted retailer profile would leave orders pointing at nothing;
    // skip rather than emitting a row with no name.
    if (!retailer) return []

    return [
      {
        ...retailer,
        orderCount: row._count._all,
        totalSpentMinor: row._sum.subtotalMinor ?? 0,
        firstOrderAt: row._min.createdAt,
        lastOrderAt: row._max.createdAt,
        // A repeat customer has ordered more than once. Cheap here, and it is
        // what the seller actually wants to see at a glance.
        isRepeat: row._count._all > 1,
      },
    ]
  })
}
