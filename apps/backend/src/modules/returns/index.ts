import { Elysia, t } from 'elysia'
import { ORDER_STATUSES } from '@metoo/shared'
import { brandIdForUser, retailerIdForUser } from '../../lib/profile.ts'
import { requireAccess } from '../../middleware/auth.ts'
import * as service from './service.ts'

const returnRequest = t.Object({
  id: t.String(),
  reason: t.String(),
  photoUrls: t.Array(t.String()),
  status: t.UnionEnum(['REQUESTED', 'ACCEPTED', 'REJECTED']),
  reviewNote: t.Union([t.String(), t.Null()]),
  reviewedAt: t.Union([t.Date(), t.Null()]),
  createdAt: t.Date(),
  order: t.Object({
    id: t.String(),
    orderNumber: t.String(),
    status: t.UnionEnum(ORDER_STATUSES),
    totalMinor: t.Integer(),
    brand: t.Object({ id: t.String(), name: t.String() }),
    retailer: t.Object({ id: t.String(), shopName: t.String() }),
  }),
})

const decisionBody = t.Object({
  reviewNote: t.Optional(t.String({ maxLength: 1000 })),
  refundReference: t.Optional(t.String({ maxLength: 200 })),
})

/** Retailer side — raise and track. */
export const returnsModule = new Elysia({ name: 'returns', prefix: '/returns' })
  .use(requireAccess({ roles: ['RETAILER'], approved: true }))

  .get(
    '/',
    async ({ auth }) =>
      service.listForRetailer(await retailerIdForUser(auth.userId)),
    {
      detail: { summary: 'Your return requests', tags: ['Returns'] },
      response: { 200: t.Array(returnRequest) },
    }
  )

  .post(
    '/',
    async ({ auth, body, set }) => {
      set.status = 201
      return service.requestReturn({
        retailerId: await retailerIdForUser(auth.userId),
        orderId: body.orderId,
        reason: body.reason,
        photoUrls: body.photoUrls,
      })
    },
    {
      body: t.Object({
        orderId: t.String({ format: 'uuid' }),
        reason: t.String({ minLength: 1, maxLength: 2000 }),
        photoUrls: t.Optional(t.Array(t.String({ maxLength: 2000 }))),
      }),
      detail: {
        summary: 'Raise a return',
        description:
          'Only against a DELIVERED or SETTLED order — you cannot return what ' +
          'you have not received. One per order. Another retailer’s order id ' +
          'returns 404 rather than 403.',
        tags: ['Returns'],
      },
      response: { 201: returnRequest },
    }
  )

/** Brand side — review returns against your own orders. */
export const brandReturnsModule = new Elysia({
  name: 'brand-returns',
  prefix: '/brand/returns',
})
  .use(requireAccess({ roles: ['BRAND'], approved: true }))

  .get(
    '/',
    async ({ auth }) =>
      service.listForReviewer({ brandId: await brandIdForUser(auth.userId) }),
    {
      detail: {
        summary: 'Returns against your orders',
        description: 'Oldest first — this is a queue.',
        tags: ['Brand · Returns'],
      },
      response: { 200: t.Array(returnRequest) },
    }
  )

  .patch(
    '/:id/accept',
    async ({ auth, params, body }) =>
      service.reviewReturn({
        returnId: params.id,
        decision: 'ACCEPTED',
        reviewNote: body?.reviewNote,
        refundReference: body?.refundReference,
        reviewerUserId: auth.userId,
        brandId: await brandIdForUser(auth.userId),
      }),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Optional(decisionBody),
      detail: {
        summary: 'Accept a return',
        description:
          'Records the refund, takes back what your wallet was credited, and ' +
          'closes the order — in one transaction. A settled order is debited ' +
          'its payout; one still awaiting settlement is not, because nothing ' +
          'was credited yet.',
        tags: ['Brand · Returns'],
      },
      response: { 200: returnRequest },
    }
  )

  .patch(
    '/:id/reject',
    async ({ auth, params, body }) =>
      service.reviewReturn({
        returnId: params.id,
        decision: 'REJECTED',
        reviewNote: body.reviewNote,
        reviewerUserId: auth.userId,
        brandId: await brandIdForUser(auth.userId),
      }),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({
        reviewNote: t.String({ minLength: 1, maxLength: 1000 }),
      }),
      detail: {
        summary: 'Reject a return',
        description:
          'The order stays exactly as it was — the delivery stands. A ' +
          'reviewNote is required and is shown to the retailer.',
        tags: ['Brand · Returns'],
      },
      response: { 200: returnRequest },
    }
  )

/** Admin side — the same decisions, unscoped, for arbitration. */
export const adminReturnsModule = new Elysia({
  name: 'admin-returns',
  prefix: '/admin/returns',
})
  .use(requireAccess({ roles: ['ADMIN'] }))

  .get('/', () => service.listForReviewer({}), {
    detail: { summary: 'Every return request', tags: ['Admin · Returns'] },
    response: { 200: t.Array(returnRequest) },
  })

  .patch(
    '/:id/accept',
    ({ params, body, auth }) =>
      service.reviewReturn({
        returnId: params.id,
        decision: 'ACCEPTED',
        reviewNote: body?.reviewNote,
        refundReference: body?.refundReference,
        reviewerUserId: auth.userId,
      }),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Optional(decisionBody),
      detail: {
        summary: 'Accept a return',
        description:
          'For arbitration when a brand and retailer disagree. Same effects ' +
          'as the brand route, not scoped to one brand.',
        tags: ['Admin · Returns'],
      },
      response: { 200: returnRequest },
    }
  )

  .patch(
    '/:id/reject',
    ({ params, body, auth }) =>
      service.reviewReturn({
        returnId: params.id,
        decision: 'REJECTED',
        reviewNote: body.reviewNote,
        reviewerUserId: auth.userId,
      }),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({
        reviewNote: t.String({ minLength: 1, maxLength: 1000 }),
      }),
      detail: { summary: 'Reject a return', tags: ['Admin · Returns'] },
      response: { 200: returnRequest },
    }
  )
