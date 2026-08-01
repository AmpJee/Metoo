import { Elysia, t } from 'elysia'
import { brandIdForUser, retailerIdForUser } from '../../lib/profile.ts'
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

const brandProfile = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Union([t.String(), t.Null()]),
  logoUrl: t.Union([t.String(), t.Null()]),
  phone: t.String(),
  addressLine: t.String(),
  province: t.String(),
  postalCode: t.String(),
  bankName: t.Union([t.String(), t.Null()]),
  bankAccountName: t.Union([t.String(), t.Null()]),
  /** Never the full number — that is admin-only PII. */
  bankAccountLast4: t.Union([t.String(), t.Null()]),
  updatedAt: t.Date(),
})

export const brandProfileModule = new Elysia({
  name: 'brand-profile',
  prefix: '/brand/profile',
})
  .use(requireAccess({ roles: ['BRAND'] }))

  .get(
    '/',
    async ({ auth }) => service.getBrand(await brandIdForUser(auth.userId)),
    {
      detail: {
        summary: 'Your brand profile',
        description:
          'Bank details come back as the bank name plus the last four ' +
          'digits — the design renders "SCB •••• 4821", and the full number ' +
          'is admin-only PII that the brand’s own screen does not need.',
        tags: ['Brand · Profile'],
      },
      response: { 200: brandProfile },
    }
  )

  .patch(
    '/',
    async ({ auth, body }) =>
      service.updateBrand(await brandIdForUser(auth.userId), body),
    {
      body: t.Object(
        {
          name: t.Optional(t.String({ minLength: 1, maxLength: 120 })),
          description: t.Optional(
            t.Union([t.String({ maxLength: 1000 }), t.Null()])
          ),
          ...t.Partial(t.Object(CONTACT_FIELDS)).properties,
        },
        { minProperties: 1 }
      ),
      detail: {
        summary: 'Edit your brand profile',
        description:
          'Partial — send only what changed. Renaming the brand changes it ' +
          'everywhere, including on past orders, deliberately: a product ' +
          'name is snapshotted because it genuinely differs order to order, ' +
          'whereas a brand renaming itself is one continuous business and ' +
          'the name it trades under now is the truthful one to show. ' +
          'Pipeline fields (อย. status, size band, admin notes) are ' +
          'admin-maintained and not editable here.',
        tags: ['Brand · Profile'],
      },
      response: { 200: brandProfile },
    }
  )

  .put(
    '/bank',
    async ({ auth, body }) =>
      service.replaceBankDetails(await brandIdForUser(auth.userId), body),
    {
      body: t.Object({
        bankName: t.String({ minLength: 1, maxLength: 100 }),
        bankAccountName: t.String({ minLength: 1, maxLength: 120 }),
        // A string, not a number: this is an identifier, leading zeros are
        // significant, and Thai account numbers are normally written with
        // separators.
        bankAccountNumber: t.String({ pattern: '^[0-9][0-9 -]{7,24}$' }),
      }),
      detail: {
        summary: 'Set where withdrawals are paid',
        description:
          'PUT, not PATCH: the three fields move together. Requesting a ' +
          'withdrawal requires the complete set and fails without it, so a ' +
          'partial update could only ever produce a half-configured payout ' +
          'that breaks later — at the moment a brand is trying to get paid. ' +
          'Replacing these does not disturb withdrawals already requested; ' +
          'each one copied the details it was made with.',
        tags: ['Brand · Profile'],
      },
      response: { 200: brandProfile },
    }
  )
