import { Elysia, t } from 'elysia'
import { retailerIdForUser } from '../../lib/profile.ts'
import { requireAccess } from '../../middleware/auth.ts'
import { cartIdForUser } from '../cart/service.ts'
import * as service from './service.ts'

const orderSummary = t.Object({
  id: t.String(),
  orderNumber: t.String(),
  checkoutGroupId: t.String(),
  status: t.UnionEnum(['PENDING']),
  subtotalMinor: t.Integer(),
  totalMinor: t.Integer(),
  /** Snapshot in basis points — 400 is 4.00%. Never recomputed. */
  commissionBps: t.Integer(),
  commissionMinor: t.Integer(),
  payoutMinor: t.Integer(),
  createdAt: t.Date(),
  brand: t.Object({ id: t.String(), name: t.String() }),
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

export const checkoutModule = new Elysia({
  name: 'checkout',
  prefix: '/checkout',
})
  .use(requireAccess({ roles: ['RETAILER'], approved: true }))

  .post(
    '/',
    async ({ auth, set }) => {
      const [cartId, retailerId] = await Promise.all([
        cartIdForUser(auth.userId),
        retailerIdForUser(auth.userId),
      ])

      set.status = 201
      return service.checkout({ cartId, retailerId })
    },
    {
      detail: {
        summary: 'Place the cart as orders',
        description:
          'Creates ONE ORDER PER BRAND — a cart spanning three brands produces ' +
          'three orders sharing a checkoutGroupId, each independently payable ' +
          'so one brand is never blocked by another. Every line is ' +
          're-validated against the product as it stands now, and the ' +
          'commission rate, product names and prices are snapshotted onto the ' +
          'order. The cart is emptied on success. Payment is a separate step.',
        tags: ['Checkout'],
      },
      response: {
        201: t.Object({
          checkoutGroupId: t.String(),
          /** How many orders were created — one per brand in the cart. */
          orderCount: t.Integer(),
          totalMinor: t.Integer(),
          orders: t.Array(orderSummary),
        }),
      },
    }
  )
