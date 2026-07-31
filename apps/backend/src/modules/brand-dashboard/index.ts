import { Elysia, t } from 'elysia'
import { ORDER_STATUSES } from '@metoo/shared'
import { brandIdForUser } from '../../lib/profile.ts'
import { optionalEnum } from '../../lib/schema.ts'
import { requireAccess } from '../../middleware/auth.ts'
import * as service from './service.ts'

export const brandDashboardModule = new Elysia({
  name: 'brand-dashboard',
  prefix: '/brand/dashboard',
})
  .use(requireAccess({ roles: ['BRAND'], approved: true }))

  .get(
    '/',
    async ({ auth, query }) =>
      service.dashboard(
        await brandIdForUser(auth.userId),
        query.period ?? 'week'
      ),
    {
      query: t.Object({
        period: optionalEnum(['day', 'week', 'month', 'year'] as const),
      }),
      detail: {
        summary: 'Seller dashboard',
        description:
          'Everything the dashboard shows, in one call — the whole screen ' +
          'loads together rather than tile by tile. Revenue counts confirmed ' +
          'orders onward; a PENDING order is a request, not a sale. Repeat ' +
          'rate is always trailing twelve months regardless of the period ' +
          'toggle, since a one-day window would read 0% on most days.',
        tags: ['Brand · Dashboard'],
      },
      response: {
        200: t.Object({
          period: t.UnionEnum(['day', 'week', 'month', 'year']),
          store: t.Object({
            name: t.String(),
            memberSince: t.Union([t.Date(), t.Null()]),
            activeProducts: t.Integer(),
            totalProducts: t.Integer(),
            newOrders: t.Integer(),
          }),
          revenueMinor: t.Integer(),
          orderCount: t.Integer(),
          averageOrderValueMinor: t.Integer(),
          repeatOrderRate: t.Object({
            repeatOrders: t.Integer(),
            totalOrders: t.Integer(),
            percent: t.Integer(),
          }),
          chart: t.Array(
            t.Object({
              date: t.String(),
              valueMinor: t.Integer(),
              count: t.Integer(),
            })
          ),
          stock: t.Array(
            t.Object({
              id: t.String(),
              name: t.String(),
              photoUrl: t.Union([t.String(), t.Null()]),
              stockPacks: t.Union([t.Integer(), t.Null()]),
              isActive: t.Boolean(),
              needsAttention: t.Boolean(),
            })
          ),
          recentOrders: t.Array(
            t.Object({
              id: t.String(),
              orderNumber: t.String(),
              status: t.UnionEnum(ORDER_STATUSES),
              totalMinor: t.Integer(),
              createdAt: t.Date(),
              retailer: t.Object({ shopName: t.String() }),
            })
          ),
        }),
      },
    }
  )
