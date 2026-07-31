/**
 * The seller dashboard.
 *
 * One endpoint, not six. Every tile on the screen loads together, and six
 * round-trips to render one page would show the numbers arriving one at a
 * time.
 *
 * The queries are split into named functions below rather than one long
 * Promise.all, so each tile's data has an obvious home and the assembly at the
 * bottom reads as a description of the screen.
 */
import { prisma } from '../../config/prisma.ts'
import type { Period } from '../../domain/analytics.ts'
import {
  averageOrderValue,
  bucketByDay,
  periodStart,
  repeatOrderRate,
} from '../../domain/analytics.ts'
import { loadOrderFacts } from '../../lib/order-facts.ts'
import { storeRating } from '../reviews/service.ts'

/** Stock at or below this many packs is flagged on the dashboard. */
const LOW_STOCK_PACKS = 10

/** How many recent orders the dashboard lists. */
const RECENT_ORDER_LIMIT = 6

function storeStats(brandId: string) {
  return prisma.brandProfile.findUnique({
    where: { id: brandId },
    select: {
      name: true,
      createdAt: true,
      _count: { select: { products: true } },
    },
  })
}

function stockLevels(brandId: string) {
  return prisma.product.findMany({
    where: { brandId },
    select: {
      id: true,
      name: true,
      photoUrl: true,
      stockPacks: true,
      isActive: true,
    },
    // Lowest stock first: the products needing attention are the point.
    orderBy: { stockPacks: 'asc' },
  })
}

function recentOrders(brandId: string) {
  return prisma.order.findMany({
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
    take: RECENT_ORDER_LIMIT,
  })
}

export async function dashboard(brandId: string, period: Period) {
  const from = periodStart(period)

  const [orders, trailingYear, products, recent, brand, rating] =
    await Promise.all([
      loadOrderFacts({ brandId, since: from }),
      // Repeat rate is a trailing-twelve-month figure regardless of the toggle
      // — a one-day window would say 0% on most days and mean nothing. The
      // design captions it "Trailing 12 months" for the same reason.
      loadOrderFacts({ brandId, since: periodStart('year') }),
      stockLevels(brandId),
      recentOrders(brandId),
      storeStats(brandId),
      storeRating(brandId),
    ])

  return {
    period,
    store: {
      name: brand?.name ?? '',
      memberSince: brand?.createdAt ?? null,
      activeProducts: products.filter((p) => p.isActive).length,
      totalProducts: brand?._count.products ?? 0,
      newOrders: recent.filter((o) => o.status === 'PENDING').length,
      // The "4.8 Store rating" tile. Null until someone reviews.
      rating,
    },
    revenueMinor: orders.reduce((sum, o) => sum + o.subtotalMinor, 0),
    orderCount: orders.length,
    averageOrderValueMinor: averageOrderValue(orders),
    repeatOrderRate: repeatOrderRate(trailingYear),
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
