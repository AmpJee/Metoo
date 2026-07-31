/**
 * The seller dashboard.
 *
 * One endpoint, not six. Every tile on the screen loads together, and six
 * round-trips to render one page would show the numbers arriving one at a
 * time.
 *
 * Revenue counts orders that were actually confirmed. A PENDING order is a
 * request, not a sale, and showing it as revenue would make the figure fall
 * whenever a brand declines something.
 */
import { prisma } from '../../config/prisma.ts'
import type { Period } from '../../domain/analytics.ts'
import {
  averageOrderValue,
  bucketByDay,
  periodStart,
  repeatOrderRate,
} from '../../domain/analytics.ts'

/** Orders that count as revenue. Excludes PENDING and CANCELLED. */
const EARNED_STATUSES = [
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'PICKED_UP',
  'DELIVERED',
  'SETTLED',
  'CLOSED',
] as const

/** Stock at or below this many packs is flagged on the dashboard. */
const LOW_STOCK_PACKS = 10

export async function dashboard(brandId: string, period: Period) {
  const from = periodStart(period)

  const [orders, trailingYear, products, recent, brand] = await Promise.all([
    prisma.order.findMany({
      where: {
        brandId,
        status: { in: [...EARNED_STATUSES] },
        createdAt: { gte: from },
      },
      select: {
        createdAt: true,
        subtotalMinor: true,
        commissionMinor: true,
        deliveryCostMinor: true,
        retailerId: true,
        deliveredAt: true,
      },
      // Oldest first: repeat-rate depends on which order came first.
      orderBy: { createdAt: 'asc' },
    }),

    // Repeat rate is a trailing-twelve-month figure regardless of the toggle —
    // a one-day window would say 0% on most days and mean nothing.
    prisma.order.findMany({
      where: {
        brandId,
        status: { in: [...EARNED_STATUSES] },
        createdAt: { gte: periodStart('year') },
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
    }),

    prisma.product.findMany({
      where: { brandId },
      select: {
        id: true,
        name: true,
        photoUrl: true,
        stockPacks: true,
        isActive: true,
      },
      orderBy: { stockPacks: 'asc' },
    }),

    prisma.order.findMany({
      where: { brandId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalMinor: true,
        createdAt: true,
        retailer: { select: { shopName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),

    prisma.brandProfile.findUnique({
      where: { id: brandId },
      select: {
        name: true,
        createdAt: true,
        _count: { select: { products: true } },
      },
    }),
  ])

  const repeat = repeatOrderRate(trailingYear)

  return {
    period,
    store: {
      name: brand?.name ?? '',
      memberSince: brand?.createdAt ?? null,
      activeProducts: products.filter((p) => p.isActive).length,
      totalProducts: brand?._count.products ?? 0,
      newOrders: recent.filter((o) => o.status === 'PENDING').length,
    },
    revenueMinor: orders.reduce((sum, o) => sum + o.subtotalMinor, 0),
    orderCount: orders.length,
    averageOrderValueMinor: averageOrderValue(orders),
    repeatOrderRate: repeat,
    chart: bucketByDay(orders, from),
    stock: products.map((p) => ({
      id: p.id,
      name: p.name,
      photoUrl: p.photoUrl,
      stockPacks: p.stockPacks,
      isActive: p.isActive,
      // Null stock means the brand does not track it, which is not a warning.
      needsAttention: p.stockPacks !== null && p.stockPacks <= LOW_STOCK_PACKS,
    })),
    recentOrders: recent,
  }
}
