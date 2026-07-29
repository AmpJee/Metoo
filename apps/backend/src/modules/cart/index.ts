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
          quantity: t.Integer(),
          lineTotalMinor: t.Integer(),
          product: t.Object({
            id: t.String(),
            name: t.String(),
            photoUrl: t.Union([t.String(), t.Null()]),
            unitPriceMinor: t.Integer(),
            moq: t.Integer(),
            caseSize: t.Integer(),
            isActive: t.Boolean(),
          }),
        })
      ),
      subtotalMinor: t.Integer(),
    })
  ),
})

const quantity = t.Integer({ minimum: 1 })

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
        body.quantity
      ),
    {
      body: t.Object({
        productId: t.String({ format: 'uuid' }),
        quantity,
      }),
      detail: {
        summary: 'Add a product to the cart',
        description:
          'Quantity must be at least the product’s MOQ and an exact multiple ' +
          'of its case size, otherwise 422. Adding a product already in the ' +
          'cart replaces its quantity rather than adding to it.',
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
        body.quantity
      ),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({ quantity }),
      detail: {
        summary: 'Change a line quantity',
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
