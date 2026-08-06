/**
 * The admin weekly summary.
 *
 * Platform-wide versions of the same figures the seller dashboard shows, plus
 * the two the operations team runs on: contribution margin, and how long it
 * takes a signup to become an order.
 */
import { CATEGORIES } from '@metoo/shared'
import type { Category } from '@metoo/shared'
import { prisma } from '../../config/prisma.ts'
import type { Period } from '../../domain/analytics.ts'
import { EARNS_REVENUE } from '../../domain/order-state.ts'
import {
  averageDaysToFirstOrder,
  averageFulfilmentHours,
  averageOrderValue,
  contributionMarginMinor,
  periodStart,
  repeatOrderRate,
} from '../../domain/analytics.ts'
import { loadOrderFacts } from '../../lib/order-facts.ts'

/** No payment gateway yet — see the note in CLAUDE.md on manual payment. */
const GATEWAY_FEES_MINOR = 0

export async function summary(period: Period) {
  const from = periodStart(period)

  const [orders, pipeline, gmvByBrand, retailers] = await Promise.all([
    loadOrderFacts({ since: from }),

    prisma.user.groupBy({
      by: ['role', 'status'],
      where: { role: { in: ['BRAND', 'RETAILER'] } },
      _count: { _all: true },
    }),

    prisma.order.groupBy({
      by: ['brandId'],
      where: { status: { in: [...EARNS_REVENUE] }, createdAt: { gte: from } },
      _sum: { subtotalMinor: true },
      orderBy: { _sum: { subtotalMinor: 'desc' } },
      take: 10,
    }),

    // Signup-to-first-order needs each retailer's earliest order, which no
    // aggregate gives directly.
    prisma.retailerProfile.findMany({
      select: {
        createdAt: true,
        orders: {
          select: { createdAt: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    }),
  ])

  const brandNames = await prisma.brandProfile.findMany({
    where: { id: { in: gmvByBrand.map((row) => row.brandId) } },
    select: { id: true, name: true },
  })
  const nameById = new Map(brandNames.map((b) => [b.id, b.name]))

  // "Onboarded brands · by category" on the summary screen.
  //
  // Derived from the products a brand actually sells, because BrandProfile has
  // no category column. A brand selling across two categories is counted in
  // both, which is truthful — but note the admin Sellers table shows ONE
  // category per brand, so if that is the intended model this wants a column
  // rather than a derivation.
  const categoryRows = await prisma.product.findMany({
    where: { isActive: true, brand: { user: { status: 'ONBOARDED' } } },
    select: { category: true, brandId: true },
    distinct: ['category', 'brandId'],
  })

  const brandsByCategory = new Map<Category, number>()
  for (const row of categoryRows) {
    brandsByCategory.set(
      row.category,
      (brandsByCategory.get(row.category) ?? 0) + 1
    )
  }

  const countFor = (role: 'BRAND' | 'RETAILER', onboarded: boolean) =>
    pipeline
      .filter(
        (row) =>
          row.role === role &&
          (onboarded ? row.status === 'ONBOARDED' : row.status !== 'DECLINED')
      )
      .reduce((sum, row) => sum + row._count._all, 0)

  return {
    period,
    onboarding: {
      brandsOnboarded: countFor('BRAND', true),
      brandsInPipeline: countFor('BRAND', false),
      retailersOnboarded: countFor('RETAILER', true),
      retailersInPipeline: countFor('RETAILER', false),
    },
    orderCount: orders.length,
    gmvMinor: orders.reduce((sum, o) => sum + o.subtotalMinor, 0),
    averageOrderValueMinor: averageOrderValue(orders),
    commissionMinor: orders.reduce((sum, o) => sum + o.commissionMinor, 0),
    logisticsCostMinor: orders.reduce((sum, o) => sum + o.deliveryCostMinor, 0),
    // No payment gateway yet, so its fee term is zero. The formula keeps the
    // parameter so adding one later is not a rewrite.
    // Always zero: payments are collected manually, so there is no gateway
    // taking a cut. Present as its own field because the design shows an
    // "Omise fees" line, and a frontend rendering a hardcoded 0 would not
    // start reporting a real number the day a gateway is added.
    gatewayFeesMinor: GATEWAY_FEES_MINOR,
    contributionMarginMinor: contributionMarginMinor(
      orders,
      GATEWAY_FEES_MINOR
    ),
    repeatOrderRate: repeatOrderRate(orders),
    averageFulfilmentHours: averageFulfilmentHours(orders),
    averageDaysToFirstOrder: averageDaysToFirstOrder(
      retailers.map((r) => ({
        createdAt: r.createdAt,
        firstOrderAt: r.orders[0]?.createdAt ?? null,
      }))
    ),
    // Every category, including the ones at zero — a bar chart with a missing
    // bar reads as a rendering bug rather than as "no brands here yet".
    brandsByCategory: CATEGORIES.map((category) => ({
      category,
      brandCount: brandsByCategory.get(category) ?? 0,
    })),
    gmvByBrand: gmvByBrand.map((row) => ({
      brandId: row.brandId,
      name: nameById.get(row.brandId) ?? '',
      gmvMinor: row._sum.subtotalMinor ?? 0,
    })),
  }
}
