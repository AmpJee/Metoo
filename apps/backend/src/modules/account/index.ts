import { Elysia, t } from 'elysia'
import { retailerIdForUser } from '../../lib/profile.ts'
import { CONTACT_FIELDS } from '../../lib/schema.ts'
import { requireAccess } from '../../middleware/auth.ts'
import * as service from './service.ts'

const retailerProfile = t.Object({
  id: t.String(),
  shopName: t.String(),
  phone: t.String(),
  addressLine: t.String(),
  province: t.String(),
  postalCode: t.String(),
  taxId: t.Union([t.String(), t.Null()]),
  updatedAt: t.Date(),
})

/**
 * No `approved: true` on this guard.
 *
 * An account still in the pipeline is exactly the one whose details an admin
 * is on the phone correcting, and a wrong address is a reason to let someone
 * fix it, not to lock the form. Nothing here touches trading.
 */
export const retailerProfileModule = new Elysia({
  name: 'retailer-profile',
  prefix: '/retailer/profile',
})
  .use(requireAccess({ roles: ['RETAILER'] }))

  .get(
    '/',
    async ({ auth }) =>
      service.getRetailer(await retailerIdForUser(auth.userId)),
    {
      detail: {
        summary: 'Your shop profile',
        tags: ['Retailer · Profile'],
      },
      response: { 200: retailerProfile },
    }
  )

  .patch(
    '/',
    async ({ auth, body }) =>
      service.updateRetailer(await retailerIdForUser(auth.userId), body),
    {
      body: t.Object(
        {
          shopName: t.Optional(t.String({ minLength: 1, maxLength: 120 })),
          taxId: t.Optional(t.Union([t.String({ maxLength: 20 }), t.Null()])),
          ...t.Partial(t.Object(CONTACT_FIELDS)).properties,
        },
        // An empty patch is a client bug every time. Answering it 200 with an
        // unchanged row hides the bug instead of reporting it.
        { minProperties: 1 }
      ),
      detail: {
        summary: 'Edit your shop profile',
        description:
          'Partial — send only what changed. The delivery address lives here, ' +
          'and it is where future orders ship; orders already placed keep the ' +
          'address they were placed with, because checkout snapshots it. ' +
          'Pipeline fields (shop type, zone, admin notes) are not editable ' +
          'here — an admin maintains those.',
        tags: ['Retailer · Profile'],
      },
      response: { 200: retailerProfile },
    }
  )
