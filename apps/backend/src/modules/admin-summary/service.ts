/**
 * The admin weekly summary.
 *
 * Platform-wide versions of the same figures the seller dashboard shows, plus
 * the two the operations team runs on: contribution margin, and how long it
 * takes a signup to become an order.
 */
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
    contributionMarginMinor: contributionMarginMinor(orders, 0),
    repeatOrderRate: repeatOrderRate(orders),
    averageFulfilmentHours: averageFulfilmentHours(orders),
    averageDaysToFirstOrder: averageDaysToFirstOrder(
      retailers.map((r) => ({
        createdAt: r.createdAt,
        firstOrderAt: r.orders[0]?.createdAt ?? null,
      }))
    ),
    gmvByBrand: gmvByBrand.map((row) => ({
      brandId: row.brandId,
      name: nameById.get(row.brandId) ?? '',
      gmvMinor: row._sum.subtotalMinor ?? 0,
    })),
  }
}
