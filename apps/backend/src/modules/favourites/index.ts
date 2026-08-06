import { Elysia, t } from 'elysia'
import { CATEGORIES } from '@metoo/shared'
import { requireAccess } from '../../middleware/auth.ts'
import * as service from './service.ts'

const savedProduct = t.Object({
  savedAt: t.Date(),
  id: t.String(),
  name: t.String(),
  photoUrl: t.Union([t.String(), t.Null()]),
  pricePerPackMinor: t.Integer(),
  minPacks: t.Integer(),
  unitsPerPack: t.Integer(),
  category: t.UnionEnum(CATEGORIES),
  /** False once the brand retires the product — kept visible, but flagged. */
  isActive: t.Boolean(),
  brand: t.Object({ id: t.String(), name: t.String() }),
})

const toggleResult = t.Object({
  saved: t.Boolean(),
  kind: t.UnionEnum(['FAVOURITE', 'SAVED_FOR_LATER']),
})

/**
 * Two lists over one model. `/favourites` and `/saved-for-later` are separate
 * paths rather than one route with a query flag, because they are separate
 * screens and separate icons — a caller should not be able to forget which
 * list it meant.
 */
function savedListModule(
  name: string,
  prefix: string,
  kind: 'FAVOURITE' | 'SAVED_FOR_LATER',
  label: string
) {
  return new Elysia({ name, prefix })
    .use(requireAccess({ roles: ['RETAILER'], approved: true }))

    .get(
      '/',
      async ({ auth }) =>
        service.list(await service.retailerIdForUser(auth.userId), kind),
      {
        detail: {
          summary: `List ${label}`,
          description:
            'Newest first. Includes products the brand has since retired, ' +
            'marked isActive false, so they do not disappear without ' +
            'explanation.',
          tags: ['Saved'],
        },
        response: { 200: t.Array(savedProduct) },
      }
    )

    .post(
      '/:productId',
      async ({ auth, params }) =>
        service.add(
          await service.retailerIdForUser(auth.userId),
          params.productId,
          kind
        ),
      {
        params: t.Object({ productId: t.String({ format: 'uuid' }) }),
        detail: {
          summary: `Add to ${label}`,
          description:
            'Idempotent — adding twice is not an error. A product can be in ' +
            'both lists at once; they are different intents.',
          tags: ['Saved'],
        },
        response: { 200: toggleResult },
      }
    )

    .delete(
      '/:productId',
      async ({ auth, params }) =>
        service.remove(
          await service.retailerIdForUser(auth.userId),
          params.productId,
          kind
        ),
      {
        params: t.Object({ productId: t.String({ format: 'uuid' }) }),
        detail: {
          summary: `Remove from ${label}`,
          description:
            'Idempotent — removing what is not there is not an error.',
          tags: ['Saved'],
        },
        response: { 200: toggleResult },
      }
    )
}

export const favouritesModule = savedListModule(
  'favourites',
  '/favourites',
  'FAVOURITE',
  'favourites'
)

export const savedForLaterModule = savedListModule(
  'saved-for-later',
  '/saved-for-later',
  'SAVED_FOR_LATER',
  'saved for later'
)

/** Both flags in one call, so a product card renders its icons correctly. */
export const savedStatusModule = new Elysia({
  name: 'saved-status',
  prefix: '/products/:productId/saved',
})
  .use(requireAccess({ roles: ['RETAILER'], approved: true }))

  .get(
    '/',
    async ({ auth, params }) =>
      service.statusFor(
        await service.retailerIdForUser(auth.userId),
        params.productId
      ),
    {
      params: t.Object({ productId: t.String({ format: 'uuid' }) }),
      detail: {
        summary: 'Which lists this product is in',
        description:
          'One call rather than checking each list separately, so a card can ' +
          'render both icons in the right state.',
        tags: ['Saved'],
      },
      response: {
        200: t.Object({ favourite: t.Boolean(), savedForLater: t.Boolean() }),
      },
    }
  )
