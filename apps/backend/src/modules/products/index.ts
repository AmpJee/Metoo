/**
 * Brand product management.
 *
 * Every route requires an APPROVED brand: a pending brand can sign in and see
 * why it is blocked, but must not be able to list products a retailer would
 * then be shown.
 */
import { Elysia, t } from 'elysia'
import { CATEGORIES } from '@metoo/shared'
import { requireAccess } from '../../middleware/auth.ts'
import * as service from './service.ts'

const categorySchema = t.UnionEnum(CATEGORIES)

const productResponse = t.Object({
  id: t.String(),
  brandId: t.String(),
  name: t.String(),
  description: t.Union([t.String(), t.Null()]),
  photoUrl: t.Union([t.String(), t.Null()]),
  unitPriceMinor: t.Integer(),
  moq: t.Integer(),
  caseSize: t.Integer(),
  category: categorySchema,
  stockQty: t.Union([t.Integer(), t.Null()]),
  isActive: t.Boolean(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
})

// Prices are integer satang, never a decimal — see CLAUDE.md. Exposing this as
// `unitPriceMinor` in the API keeps the frontend honest about the unit too.
const productBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 200 }),
  description: t.Optional(t.String({ maxLength: 2000 })),
  photoUrl: t.Optional(t.String({ format: 'uri', maxLength: 2000 })),
  unitPriceMinor: t.Integer({ minimum: 1 }),
  moq: t.Integer({ minimum: 1, default: 1 }),
  caseSize: t.Integer({ minimum: 1, default: 1 }),
  category: categorySchema,
  stockQty: t.Optional(t.Integer({ minimum: 0 })),
  isActive: t.Optional(t.Boolean()),
})

export const productsModule = new Elysia({
  name: 'products',
  prefix: '/brand/products',
})
  .use(requireAccess({ roles: ['BRAND'], approved: true }))

  .get(
    '/',
    async ({ auth }) =>
      service.listForBrand(await service.brandIdForUser(auth.userId)),
    {
      detail: {
        summary: "List this brand's products",
        description: 'Includes inactive products, which retailers cannot see.',
        tags: ['Brand · Products'],
      },
      response: { 200: t.Array(productResponse) },
    }
  )

  .post(
    '/',
    async ({ auth, body, set }) => {
      set.status = 201
      return service.create(await service.brandIdForUser(auth.userId), body)
    },
    {
      body: productBody,
      detail: {
        summary: 'Create a product',
        description:
          'photoUrl is a plain image URL for now; a Supabase upload route ' +
          'replaces it later. moq and caseSize are the wholesale terms ' +
          'enforced when a retailer adds this to a cart.',
        tags: ['Brand · Products'],
      },
      response: { 201: productResponse },
    }
  )

  .get(
    '/:id',
    async ({ auth, params }) =>
      service.getForBrand(await service.brandIdForUser(auth.userId), params.id),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      detail: {
        summary: 'Get one of this brand’s products',
        description:
          'Another brand’s product id returns 404 rather than 403, so the ' +
          'endpoint cannot be used to discover that an id exists.',
        tags: ['Brand · Products'],
      },
      response: { 200: productResponse },
    }
  )

  .patch(
    '/:id',
    async ({ auth, params, body }) =>
      service.update(
        await service.brandIdForUser(auth.userId),
        params.id,
        body
      ),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Partial(productBody),
      detail: {
        summary: 'Update a product',
        description:
          'Editing a price does not rewrite history — OrderItem snapshots the ' +
          'price at the time of sale.',
        tags: ['Brand · Products'],
      },
      response: { 200: productResponse },
    }
  )

  .delete(
    '/:id',
    async ({ auth, params }) =>
      service.remove(await service.brandIdForUser(auth.userId), params.id),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      detail: {
        summary: 'Delete or retire a product',
        description:
          'A product that has never been ordered is deleted. One that has is ' +
          'deactivated instead, because order history still references it.',
        tags: ['Brand · Products'],
      },
      response: {
        200: t.Object({ deleted: t.Boolean(), deactivated: t.Boolean() }),
      },
    }
  )
