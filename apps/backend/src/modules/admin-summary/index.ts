import { Elysia, t } from 'elysia'
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
        'logistics; there is no payment gateway yet, so that term is zero.',
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
