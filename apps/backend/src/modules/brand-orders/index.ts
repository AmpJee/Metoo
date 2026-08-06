import { Elysia, t } from 'elysia'
import { ORDER_STATUSES, PAYMENT_PREFERENCES } from '@metoo/shared'
import { brandIdForUser } from '../../lib/profile.ts'
import { optionalEnum } from '../../lib/schema.ts'
import { requireAccess } from '../../middleware/auth.ts'
import * as service from './service.ts'

const brandOrder = t.Object({
  id: t.String(),
  orderNumber: t.String(),
  status: t.UnionEnum(ORDER_STATUSES),
  subtotalMinor: t.Integer(),
  totalMinor: t.Integer(),
  /** What this brand receives once the order settles. */
  payoutMinor: t.Integer(),
  commissionBps: t.Integer(),
  commissionMinor: t.Integer(),
  paymentMethod: t.UnionEnum(PAYMENT_PREFERENCES),
  shippingAddress: t.Unknown(),
  confirmedAt: t.Union([t.Date(), t.Null()]),
  readyForPickupAt: t.Union([t.Date(), t.Null()]),
  pickedUpAt: t.Union([t.Date(), t.Null()]),
  deliveredAt: t.Union([t.Date(), t.Null()]),
  settledAt: t.Union([t.Date(), t.Null()]),
  createdAt: t.Date(),
  retailer: t.Object({
    id: t.String(),
    shopName: t.String(),
    province: t.String(),
  }),
  items: t.Array(
    t.Object({
      id: t.String(),
      productId: t.String(),
      productName: t.String(),
      pricePerPackMinor: t.Integer(),
      unitsPerPack: t.Integer(),
      packs: t.Integer(),
      lineTotalMinor: t.Integer(),
    })
  ),
  /** The buttons the tracker should render, in order. */
  actions: t.Array(
    t.Object({ to: t.UnionEnum(ORDER_STATUSES), label: t.String() })
  ),
})

export const brandOrdersModule = new Elysia({
  name: 'brand-orders',
  prefix: '/brand/orders',
})
  .use(requireAccess({ roles: ['BRAND'], approved: true }))

  .get(
    '/',
    async ({ auth, query }) =>
      service.listForBrand(await brandIdForUser(auth.userId), {
        status: query.status,
      }),
    {
      query: t.Object({ status: optionalEnum(ORDER_STATUSES) }),
      detail: {
        summary: 'Orders placed with this brand',
        description:
          'Newest first. Each order carries the actions available from its ' +
          'current state, so the tracker renders buttons without duplicating ' +
          'the transition rules.',
        tags: ['Brand · Orders'],
      },
      response: { 200: t.Array(brandOrder) },
    }
  )

  .get(
    '/counts',
    async ({ auth }) =>
      service.countsForBrand(await brandIdForUser(auth.userId)),
    {
      detail: {
        summary: 'Order counts per status',
        description: 'Drives the tab bar above the order tracker.',
        tags: ['Brand · Orders'],
      },
      response: {
        200: t.Object({
          all: t.Integer(),
          // Keys spelled out rather than t.Record: a Record keyed by a union
          // enum infers its value type as `never`, and this also documents
          // every tab in /openapi.
          byStatus: t.Object(
            Object.fromEntries(
              ORDER_STATUSES.map((status) => [status, t.Integer()])
            ) as Record<
              (typeof ORDER_STATUSES)[number],
              ReturnType<typeof t.Integer>
            >
          ),
        }),
      },
    }
  )

  .get(
    '/:id',
    async ({ auth, params }) =>
      service.getForBrand(await brandIdForUser(auth.userId), params.id),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      detail: {
        summary: 'One order',
        description:
          'Another brand’s order id returns 404 rather than 403, so the ' +
          'endpoint cannot confirm that an id exists.',
        tags: ['Brand · Orders'],
      },
      response: { 200: brandOrder },
    }
  )

  .patch(
    '/:id/status',
    async ({ auth, params, body }) =>
      service.transition({
        brandId: await brandIdForUser(auth.userId),
        orderId: params.id,
        to: body.status,
        actor: 'BRAND',
        actorUserId: auth.userId,
      }),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({ status: t.UnionEnum(ORDER_STATUSES) }),
      detail: {
        summary: 'Advance an order',
        description:
          'PENDING → CONFIRMED → READY_FOR_PICKUP → PICKED_UP → DELIVERED ' +
          '→ SETTLED, one step at a time. A brand may only make the first ' +
          'move: accepting the order. Logistics is admin’s, and SETTLED is ' +
          'the retailer confirming they received the goods — which is what ' +
          'releases this brand’s money, so the seller cannot press it. ' +
          'Skipping a step, going backwards, or touching a settled order ' +
          'returns 422. Every move is audit logged.',
        tags: ['Brand · Orders'],
      },
      response: { 200: brandOrder },
    }
  )
