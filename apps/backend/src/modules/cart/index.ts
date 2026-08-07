import { Elysia, t } from 'elysia'
import { requireAccess } from '../../middleware/auth.ts'
import * as service from './service.ts'

const cartResponse = t.Object({
  /** Number of orders this cart will become at checkout — one per brand. */
  brandCount: t.Integer(),
  itemCount: t.Integer(),
  totalMinor: t.Integer(),
  groups: t.Array(
    t.Object({
      brand: t.Object({ id: t.String(), name: t.String() }),
      items: t.Array(
        t.Object({
          id: t.String(),
          packs: t.Integer(),
          /**
           * What one pack costs on THIS line, after volume pricing.
           *
           * Distinct from product.pricePerPackMinor, which is the list price:
           * a line that reached a tier is charged less, and the cart has to
           * show the number it is actually charging or its own arithmetic
           * does not add up.
           */
          pricePerPackMinor: t.Integer(),
          lineTotalMinor: t.Integer(),
          product: t.Object({
            id: t.String(),
            name: t.String(),
            photoUrl: t.Union([t.String(), t.Null()]),
            pricePerPackMinor: t.Integer(),
            minPacks: t.Integer(),
            unitsPerPack: t.Integer(),
            isActive: t.Boolean(),
          }),
        })
      ),
      subtotalMinor: t.Integer(),
    })
  ),
})

const packs = t.Integer({ minimum: 1 })

export const cartModule = new Elysia({ name: 'cart', prefix: '/cart' })
  .use(requireAccess({ roles: ['RETAILER'], approved: true }))

  .get(
    '/',
    async ({ auth }) =>
      service.getCart(await service.cartIdForUser(auth.userId)),
    {
      detail: {
        summary: 'Get the cart, grouped by brand',
        description:
          'Each group becomes one order at checkout, with its own payment. ' +
          'brandCount is how many orders the retailer is about to create.',
        tags: ['Cart'],
      },
      response: { 200: cartResponse },
    }
  )

  .post(
    '/items',
    async ({ auth, body }) =>
      service.addItem(
        await service.cartIdForUser(auth.userId),
        body.productId,
        body.packs
      ),
    {
      body: t.Object({
        productId: t.String({ format: 'uuid' }),
        packs,
      }),
      detail: {
        summary: 'Add a product to the cart',
        description:
          'Quantity must be at least the product’s MOQ and an exact multiple ' +
          'of its case size, otherwise 422. Adding a product already in the ' +
          'cart replaces its packs rather than adding to it.',
        tags: ['Cart'],
      },
      response: { 200: cartResponse },
    }
  )

  .patch(
    '/items/:id',
    async ({ auth, params, body }) =>
      service.updateItem(
        await service.cartIdForUser(auth.userId),
        params.id,
        body.packs
      ),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({ packs }),
      detail: {
        summary: 'Change a line packs',
        description: 'Same MOQ and case-size rules as adding.',
        tags: ['Cart'],
      },
      response: { 200: cartResponse },
    }
  )

  .delete(
    '/items/:id',
    async ({ auth, params }) =>
      service.removeItem(await service.cartIdForUser(auth.userId), params.id),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      detail: { summary: 'Remove a line', tags: ['Cart'] },
      response: { 200: cartResponse },
    }
  )

  .delete(
    '/',
    async ({ auth }) => service.clear(await service.cartIdForUser(auth.userId)),
    {
      detail: { summary: 'Empty the cart', tags: ['Cart'] },
      response: { 200: cartResponse },
    }
  )
