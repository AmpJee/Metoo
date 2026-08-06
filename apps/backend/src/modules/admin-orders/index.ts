import { Elysia, t } from 'elysia'
import { ORDER_STATUSES, PAYMENT_PREFERENCES } from '@metoo/shared'
import { optionalEnum } from '../../lib/schema.ts'
import { requireAccess } from '../../middleware/auth.ts'
import * as brandOrders from '../brand-orders/service.ts'
import * as service from './service.ts'

const adminOrder = t.Object({
  id: t.String(),
  orderNumber: t.String(),
  status: t.UnionEnum(ORDER_STATUSES),
  /** GMV for this order. */
  subtotalMinor: t.Integer(),
  totalMinor: t.Integer(),
  commissionBps: t.Integer(),
  commissionMinor: t.Integer(),
  payoutMinor: t.Integer(),
  /** What logistics cost the platform, entered by admin after the fact. */
  deliveryCostMinor: t.Integer(),
  paymentMethod: t.UnionEnum(PAYMENT_PREFERENCES),
  confirmedAt: t.Union([t.Date(), t.Null()]),
  deliveredAt: t.Union([t.Date(), t.Null()]),
  settledAt: t.Union([t.Date(), t.Null()]),
  createdAt: t.Date(),
  brand: t.Object({ id: t.String(), name: t.String() }),
  retailer: t.Object({
    id: t.String(),
    shopName: t.String(),
    province: t.String(),
  }),
  items: t.Array(
    t.Object({
      productName: t.String(),
      packs: t.Integer(),
      lineTotalMinor: t.Integer(),
    })
  ),
  /** Only on a retailer's first order; null on the rest, shown as "—". */
  signupToFirstOrderDays: t.Union([t.Integer(), t.Null()]),
  /** Null until delivered — an undelivered order has no duration yet. */
  fulfilmentHours: t.Union([t.Integer(), t.Null()]),
  /** False on a retailer's first counted order, true after. */
  isRepeat: t.Boolean(),
  retailerId: t.String(),
  /** The moves an admin may make from here, in order. */
  actions: t.Array(
    t.Object({ to: t.UnionEnum(ORDER_STATUSES), label: t.String() })
  ),
})

export const adminOrdersModule = new Elysia({
  name: 'admin-orders',
  prefix: '/admin/orders',
})
  .use(requireAccess({ roles: ['ADMIN'] }))

  .get(
    '/',
    ({ query }) =>
      service.listAll({
        status: query.status,
        brandId: query.brandId,
        retailerId: query.retailerId,
        q: query.q,
      }),
    {
      query: t.Object({
        status: optionalEnum(ORDER_STATUSES),
        brandId: t.Optional(t.String({ format: 'uuid' })),
        retailerId: t.Optional(t.String({ format: 'uuid' })),
        /** The console search box: order number, brand or shop. */
        q: t.Optional(t.String({ maxLength: 100 })),
      }),
      detail: {
        summary: 'Every order on the platform',
        description:
          'Both sides plus the full commission arithmetic — the table ' +
          'operations runs the business from. Newest first.',
        tags: ['Admin · Orders'],
      },
      response: { 200: t.Array(adminOrder) },
    }
  )

  .get('/:id', ({ params }) => service.getById(params.id), {
    params: t.Object({ id: t.String({ format: 'uuid' }) }),
    detail: { summary: 'One order', tags: ['Admin · Orders'] },
    response: { 200: adminOrder },
  })

  .patch(
    '/:id/status',
    async ({ params, body, auth }) => {
      // No brandId filter: an admin override is not scoped to one brand.
      // Same state machine, different actor.
      await brandOrders.transition({
        orderId: params.id,
        to: body.status,
        actor: 'ADMIN',
        actorUserId: auth.userId,
      })

      return service.getById(params.id)
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({ status: t.UnionEnum(ORDER_STATUSES) }),
      detail: {
        summary: 'Override an order’s status',
        description:
          'For correcting a seller mistake. The same transition rules apply — ' +
          'an admin cannot skip steps or reopen a settled order either, since ' +
          'its wallet ledger rows are append-only.',
        tags: ['Admin · Orders'],
      },
      response: { 200: adminOrder },
    }
  )

  .patch(
    '/:id/delivery-cost',
    ({ params, body, auth }) =>
      service.setDeliveryCost({
        adminId: auth.userId,
        orderId: params.id,
        deliveryCostMinor: body.deliveryCostMinor,
      }),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({ deliveryCostMinor: t.Integer({ minimum: 0 }) }),
      detail: {
        summary: 'Record what delivery cost',
        description:
          'Entered after the fact, when the courier invoice arrives. Feeds ' +
          'the contribution-margin figure on the dashboard.',
        tags: ['Admin · Orders'],
      },
      response: { 200: adminOrder },
    }
  )
