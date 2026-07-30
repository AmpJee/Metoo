import { Elysia, t } from 'elysia'
import { CATEGORIES } from '@metoo/shared'
import { requireAccess } from '../../middleware/auth.ts'
import * as service from './service.ts'

const favourite = t.Object({
  favouritedAt: t.Date(),
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

export const favouritesModule = new Elysia({
  name: 'favourites',
  prefix: '/favourites',
})
  .use(requireAccess({ roles: ['RETAILER'], approved: true }))

  .get(
    '/',
    async ({ auth }) =>
      service.list(await service.retailerIdForUser(auth.userId)),
    {
      detail: {
        summary: 'List favourited products',
        description:
          'Includes products the brand has since retired, marked isActive ' +
          'false, so they do not disappear without explanation.',
        tags: ['Favourites'],
      },
      response: { 200: t.Array(favourite) },
    }
  )

  .post(
    '/:productId',
    async ({ auth, params }) =>
      service.add(
        await service.retailerIdForUser(auth.userId),
        params.productId
      ),
    {
      params: t.Object({ productId: t.String({ format: 'uuid' }) }),
      detail: {
        summary: 'Favourite a product',
        description: 'Idempotent — favouriting twice is not an error.',
        tags: ['Favourites'],
      },
      response: { 200: t.Object({ favourited: t.Boolean() }) },
    }
  )

  .delete(
    '/:productId',
    async ({ auth, params }) =>
      service.remove(
        await service.retailerIdForUser(auth.userId),
        params.productId
      ),
    {
      params: t.Object({ productId: t.String({ format: 'uuid' }) }),
      detail: {
        summary: 'Remove a favourite',
        description: 'Idempotent — removing a non-favourite is not an error.',
        tags: ['Favourites'],
      },
      response: { 200: t.Object({ favourited: t.Boolean() }) },
    }
  )
