import { Elysia, t } from 'elysia'
import { ORDER_STATUSES } from '@metoo/shared'
import { retailerIdForUser } from '../../lib/profile.ts'
import { optionalEnum } from '../../lib/schema.ts'
import { requireAccess } from '../../middleware/auth.ts'
import * as service from './service.ts'

const order = t.Object({
  id: t.String(),
  orderNumber: t.String(),
  checkoutGroupId: t.String(),
  status: t.UnionEnum(ORDER_STATUSES),
  subtotalMinor: t.Integer(),
  shippingMinor: t.Integer(),
  totalMinor: t.Integer(),
  /** Snapshot of the delivery address at the time of the order. */
  shippingAddress: t.Unknown(),
  confirmedAt: t.Union([t.Date(), t.Null()]),
  pickedUpAt: t.Union([t.Date(), t.Null()]),
  deliveredAt: t.Union([t.Date(), t.Null()]),
  createdAt: t.Date(),
  brand: t.Object({
    id: t.String(),
    name: t.String(),
    logoUrl: t.Union([t.String(), t.Null()]),
  }),
  items: t.Array(
    t.Object({
      id: t.String(),
      productId: t.String(),
      productName: t.String(),
      pricePerPackMinor: t.Integer(),
      packs: t.Integer(),
      lineTotalMinor: t.Integer(),
    })
  ),
})

export const ordersModule = new Elysia({ name: 'orders', prefix: '/orders' })
  .use(requireAccess({ roles: ['RETAILER'], approved: true }))

  .get(
    '/',
    async ({ auth, query }) =>
      service.listForRetailer(await retailerIdForUser(auth.userId), {
        status: query.status,
      }),
    {
      query: t.Object({ status: optionalEnum(ORDER_STATUSES) }),
      detail: {
        summary: "List the retailer's orders",
        description:
          'Newest first. Commission figures are omitted — they are the ' +
          'platform’s arrangement with the brand, not the buyer’s business.',
        tags: ['Orders'],
      },
      response: { 200: t.Array(order) },
    }
  )

  .get(
    '/group/:checkoutGroupId',
    async ({ auth, params }) =>
      service.getGroupForRetailer(
        await retailerIdForUser(auth.userId),
        params.checkoutGroupId
      ),
    {
      params: t.Object({ checkoutGroupId: t.String({ format: 'uuid' }) }),
      detail: {
        summary: 'Every order from one checkout',
        description:
          'A multi-brand basket becomes several orders. This returns them ' +
          'together for the confirmation screen, since the retailer thinks of ' +
          'it as one purchase.',
        tags: ['Orders'],
      },
      response: {
        200: t.Object({
          checkoutGroupId: t.String(),
          orderCount: t.Integer(),
          totalMinor: t.Integer(),
          orders: t.Array(order),
        }),
      },
    }
  )

  // Declared after /group/:checkoutGroupId so the literal segment is not
  // swallowed by the :id pattern.
  .get(
    '/:id',
    async ({ auth, params }) =>
      service.getForRetailer(await retailerIdForUser(auth.userId), params.id),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      detail: {
        summary: 'Order detail',
        description:
          'Another retailer’s order id returns 404 rather than 403, so the ' +
          'endpoint cannot confirm that an id exists.',
        tags: ['Orders'],
      },
      response: { 200: order },
    }
  )
