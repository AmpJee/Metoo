import { Elysia, t } from 'elysia'
import { CATEGORIES } from '@metoo/shared'
import { optionalEnum } from '../../lib/schema.ts'
import { requireAccess } from '../../middleware/auth.ts'
import * as service from './service.ts'

export const adminSummaryModule = new Elysia({
  name: 'admin-summary',
  prefix: '/admin/summary',
})
  .use(requireAccess({ roles: ['ADMIN'] }))

  .get('/', ({ query }) => service.summary(query.period ?? 'week'), {
    query: t.Object({
      period: optionalEnum(['day', 'week', 'month', 'year'] as const),
    }),
    detail: {
      summary: 'Platform weekly summary',
      description:
        'GMV, commission, logistics and contribution margin across every ' +
        'seller and retailer, plus how long a signup takes to become an ' +
        'order. GMV counts confirmed orders onward — a PENDING order is a ' +
        'request, not a sale. Contribution margin is commission minus ' +
        'logistics minus gateway fees. Payments are collected manually, so ' +
        'gatewayFeesMinor is always 0 today. brandsByCategory counts onboarded ' +
        'brands that have an active product in each category, derived from ' +
        'their products — a brand selling across two appears in both.',
      tags: ['Admin · Summary'],
    },
    response: {
      200: t.Object({
        period: t.UnionEnum(['day', 'week', 'month', 'year']),
        onboarding: t.Object({
          brandsOnboarded: t.Integer(),
          brandsInPipeline: t.Integer(),
          retailersOnboarded: t.Integer(),
          retailersInPipeline: t.Integer(),
        }),
        orderCount: t.Integer(),
        gmvMinor: t.Integer(),
        averageOrderValueMinor: t.Integer(),
        commissionMinor: t.Integer(),
        logisticsCostMinor: t.Integer(),
        contributionMarginMinor: t.Integer(),
        repeatOrderRate: t.Object({
          repeatOrders: t.Integer(),
          totalOrders: t.Integer(),
          percent: t.Integer(),
        }),
        /** Null until something has been delivered. */
        averageFulfilmentHours: t.Union([t.Integer(), t.Null()]),
        /** Null until a retailer has placed a first order. */
        averageDaysToFirstOrder: t.Union([t.Integer(), t.Null()]),
        /**
         * Always 0 — payments are collected manually, so nothing takes a cut.
         * A field rather than an omission so the design's "Omise fees" line
         * has something to bind to, and starts reporting a real number the
         * day a gateway exists.
         */
        gatewayFeesMinor: t.Integer(),
        /** Every category, including zeroes — see the note in service.ts. */
        brandsByCategory: t.Array(
          t.Object({
            category: t.UnionEnum(CATEGORIES),
            brandCount: t.Integer(),
          })
        ),
        gmvByBrand: t.Array(
          t.Object({
            brandId: t.String(),
            name: t.String(),
            gmvMinor: t.Integer(),
          })
        ),
      }),
    },
  })
