import { Elysia, t } from 'elysia'
import { MAX_RATING, MIN_RATING } from '../../domain/rating.ts'
import { retailerIdForUser } from '../../lib/profile.ts'
import { requireAccess } from '../../middleware/auth.ts'
import * as service from './service.ts'

const ratingSummary = t.Object({
  /** Null when nothing has been rated — not zero, which reads as "bad". */
  average: t.Union([t.Number(), t.Null()]),
  count: t.Integer(),
})

const review = t.Object({
  id: t.String(),
  rating: t.Integer(),
  comment: t.Union([t.String(), t.Null()]),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  retailer: t.Object({
    id: t.String(),
    shopName: t.String(),
    province: t.String(),
  }),
})

/**
 * Reading reviews is public, like the catalog they sit on.
 *
 * The star average is already on every public product card, so gating the
 * words behind it would show a visitor "4.8 (12)" and nothing to read — and
 * what other shops say is exactly what a retailer weighs before signing up.
 * Writing one is still a retailer's move; see reviewsWriteModule.
 */
export const reviewsPublicModule = new Elysia({
  name: 'reviews-public',
  prefix: '/products/:productId/reviews',
}).get(
  '/',
  ({ params, query }) =>
    service.listForProduct(params.productId, query.limit ?? 20),
  {
    params: t.Object({ productId: t.String({ format: 'uuid' }) }),
    query: t.Object({
      limit: t.Optional(t.Integer({ minimum: 1, maximum: 100 })),
    }),
    detail: {
      summary: 'Reviews for a product',
      description: 'Newest first, with the aggregate summary alongside.',
      tags: ['Reviews'],
    },
    response: {
      200: t.Object({ summary: ratingSummary, reviews: t.Array(review) }),
    },
  }
)

/** Everything that needs to know who is asking. */
export const reviewsModule = new Elysia({
  name: 'reviews',
  prefix: '/products/:productId/reviews',
})
  .use(requireAccess({ roles: ['RETAILER'], approved: true }))

  .get(
    '/mine',
    async ({ auth, params }) =>
      service.ownReview(await retailerIdForUser(auth.userId), params.productId),
    {
      params: t.Object({ productId: t.String({ format: 'uuid' }) }),
      detail: {
        summary: 'This retailer’s own review',
        description:
          'For pre-filling the form. canReview says whether a delivered order ' +
          'entitles them to write one at all.',
        tags: ['Reviews'],
      },
      response: {
        200: t.Object({
          canReview: t.Boolean(),
          review: t.Union([review, t.Null()]),
        }),
      },
    }
  )

  .put(
    '/',
    async ({ auth, params, body }) =>
      service.upsertReview({
        retailerId: await retailerIdForUser(auth.userId),
        productId: params.productId,
        rating: body.rating,
        comment: body.comment,
      }),
    {
      params: t.Object({ productId: t.String({ format: 'uuid' }) }),
      body: t.Object({
        rating: t.Integer({ minimum: MIN_RATING, maximum: MAX_RATING }),
        comment: t.Optional(t.String({ maxLength: 2000 })),
      }),
      detail: {
        summary: 'Write or change a review',
        description:
          'Requires a DELIVERED order containing the product — 403 otherwise. ' +
          'Without that rule a brand could rate its own goods and a ' +
          'competitor could rate them down, and every star on every card ' +
          'would be noise. PUT rather than POST: one review per retailer per ' +
          'product, so submitting again is a change of mind.',
        tags: ['Reviews'],
      },
      response: { 200: review },
    }
  )

  .delete(
    '/',
    async ({ auth, params }) =>
      service.deleteOwnReview(
        await retailerIdForUser(auth.userId),
        params.productId
      ),
    {
      params: t.Object({ productId: t.String({ format: 'uuid' }) }),
      detail: {
        summary: 'Remove your review',
        description:
          'Idempotent — removing one that is not there is not an error.',
        tags: ['Reviews'],
      },
      response: { 200: t.Object({ deleted: t.Boolean() }) },
    }
  )
