import { Elysia, t } from 'elysia'
import { SHOP_TYPES } from '@metoo/shared'
import { brandIdForUser } from '../../lib/profile.ts'
import { requireAccess } from '../../middleware/auth.ts'
import * as service from './service.ts'

export const brandCustomersModule = new Elysia({
  name: 'brand-customers',
  prefix: '/brand/customers',
})
  .use(requireAccess({ roles: ['BRAND'], approved: true }))

  .get(
    '/',
    async ({ auth }) => service.listForBrand(await brandIdForUser(auth.userId)),
    {
      detail: {
        summary: 'Retailers who have bought from this brand',
        description:
          'Derived from orders, highest spend first — the question this ' +
          'screen answers is "who matters", not "who is newest". Counts only ' +
          'orders that reached CONFIRMED; a request that was never accepted, ' +
          'or an order that was cancelled, does not make someone a customer.',
        tags: ['Brand · Customers'],
      },
      response: {
        200: t.Array(
          t.Object({
            id: t.String(),
            shopName: t.String(),
            shopType: t.Union([t.UnionEnum(SHOP_TYPES), t.Null()]),
            province: t.String(),
            zone: t.Union([t.String(), t.Null()]),
            phone: t.String(),
            orderCount: t.Integer(),
            totalSpentMinor: t.Integer(),
            firstOrderAt: t.Union([t.Date(), t.Null()]),
            lastOrderAt: t.Union([t.Date(), t.Null()]),
            isRepeat: t.Boolean(),
          })
        ),
      },
    }
  )
