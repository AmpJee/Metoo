import { Elysia, t } from 'elysia'
import { PAYMENT_PREFERENCES, SHOP_TYPES } from '@metoo/shared'
import { brandIdForUser, retailerIdForUser } from '../../lib/profile.ts'
import { CONTACT_FIELDS, optionalEnum } from '../../lib/schema.ts'
import { requireAccess } from '../../middleware/auth.ts'
import * as uploads from '../uploads/service.ts'
import * as service from './service.ts'

/**
 * The two-step upload contract, identical for both roles.
 *
 * POST returns a one-shot signed URL; the client PUTs the file straight to
 * Supabase; PUT here records it. The server picks the storage key, so a caller
 * can never write outside its own folder.
 */
const avatarRequestBody = t.Object({
  contentType: t.String({ maxLength: 100 }),
  sizeBytes: t.Integer({ minimum: 1 }),
})
const signedUpload = t.Object({ uploadUrl: t.String(), storageKey: t.String() })
const avatarConfirmBody = t.Object({ storageKey: t.String({ maxLength: 500 }) })
const avatarResult = t.Object({
  id: t.String(),
  name: t.String(),
  /** The retailer's avatarUrl comes back under this name too, so one component renders both. */
  logoUrl: t.Union([t.String(), t.Null()]),
})

const avatarDetail = (who: string) => ({
  description:
    `Step one returns a signed URL; PUT the file to it, then confirm with the ` +
    `returned storageKey. JPEG, PNG or WebP up to 5 MB. The key is built from ` +
    `your own ${who} id, so an upload can never land in another account's ` +
    `folder, and confirming a key that is not yours is a 403.`,
  tags: [who === 'brand' ? 'Brand · Profile' : 'Retailer · Profile'],
})

const retailerProfile = t.Object({
  id: t.String(),
  shopName: t.String(),
  phone: t.String(),
  addressLine: t.String(),
  province: t.String(),
  postalCode: t.String(),
  taxId: t.Union([t.String(), t.Null()]),
  avatarUrl: t.Union([t.String(), t.Null()]),

  // The operational details the console's Retailers table has a column for.
  // The shop supplies these; paymentReliability stays absent because that is
  // a track record admin maintains, not a self-declaration.
  shopType: t.Union([t.UnionEnum(SHOP_TYPES), t.Null()]),
  zone: t.Union([t.String(), t.Null()]),
  currentProducts: t.Union([t.String(), t.Null()]),
  monthlyCapacity: t.Union([t.Integer(), t.Null()]),
  preferredPayment: t.Union([t.UnionEnum(PAYMENT_PREFERENCES), t.Null()]),
  deliveryWindow: t.Union([t.String(), t.Null()]),

  // Where parcels go, separate from the shop address above. A shop trades at
  // one address and takes deliveries at another more often than not.
  deliveryRecipient: t.Union([t.String(), t.Null()]),
  deliveryPhone: t.Union([t.String(), t.Null()]),
  deliveryAddressLine: t.Union([t.String(), t.Null()]),
  deliverySubdistrict: t.Union([t.String(), t.Null()]),
  deliveryDistrict: t.Union([t.String(), t.Null()]),
  deliveryProvince: t.Union([t.String(), t.Null()]),
  deliveryPostalCode: t.Union([t.String(), t.Null()]),

  /** Which of the above are still blank. Empty means the shop can check out. */
  missingForCheckout: t.Array(
    t.Object({ field: t.String(), label: t.String() })
  ),
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

          // Operational details, editable by the shop itself. Admin can still
          // edit them too, from the pipeline route — onboarding happens over
          // the phone and someone is often filling these in on the shop's
          // behalf. adminNotes, referralSource, paymentReliability and the
          // pipeline status stay admin-only and are absent here.
          // optionalEnum, never t.Optional(t.UnionEnum(...)): the latter emits
          // `default: values[0]` and Elysia applies it to an ABSENT key, so a
          // PATCH of just the zone would silently write shopType=MINIMART and
          // preferredPayment=PROMPTPAY into this shop's row. See lib/schema.ts.
          shopType: optionalEnum(SHOP_TYPES),
          zone: t.Optional(t.String({ maxLength: 200 })),
          currentProducts: t.Optional(t.String({ maxLength: 500 })),
          monthlyCapacity: t.Optional(t.Integer({ minimum: 1 })),
          preferredPayment: optionalEnum(PAYMENT_PREFERENCES),
          deliveryWindow: t.Optional(t.String({ maxLength: 100 })),

          deliveryRecipient: t.Optional(t.String({ maxLength: 200 })),
          deliveryPhone: t.Optional(t.String({ maxLength: 30 })),
          deliveryAddressLine: t.Optional(t.String({ maxLength: 500 })),
          deliverySubdistrict: t.Optional(t.String({ maxLength: 100 })),
          deliveryDistrict: t.Optional(t.String({ maxLength: 100 })),
          deliveryProvince: t.Optional(t.String({ maxLength: 100 })),
          // Thai postcodes are five digits. Rejected at the edge so a typo is
          // caught here rather than by a courier holding the parcel.
          deliveryPostalCode: t.Optional(t.String({ pattern: '^\\d{5}$' })),
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
          'Shop type, zone, what you stock, capacity, preferred payment and ' +
          'delivery window are all required before checkout — the response ' +
          'lists whatever is still missing in `missingForCheckout`. ' +
          'adminNotes, referralSource, payment reliability and pipeline ' +
          'status remain admin-only and are rejected here.',
        tags: ['Retailer · Profile'],
      },
      response: { 200: retailerProfile },
    }
  )

  .post(
    '/picture',
    async ({ auth, body }) =>
      uploads.requestAvatarUpload({
        owner: 'retailers',
        ownerId: await retailerIdForUser(auth.userId),
        contentType: body.contentType,
        sizeBytes: body.sizeBytes,
      }),
    {
      body: avatarRequestBody,
      detail: {
        summary: 'Get a signed URL for your shop photo',
        ...avatarDetail('retailer'),
      },
      response: { 200: signedUpload },
    }
  )

  .put(
    '/picture',
    async ({ auth, body }) =>
      uploads.confirmAvatarUpload({
        owner: 'retailers',
        ownerId: await retailerIdForUser(auth.userId),
        storageKey: body.storageKey,
      }),
    {
      body: avatarConfirmBody,
      detail: {
        summary: 'Confirm your shop photo',
        ...avatarDetail('retailer'),
      },
      response: { 200: avatarResult },
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

  .post(
    '/picture',
    async ({ auth, body }) =>
      uploads.requestAvatarUpload({
        owner: 'brands',
        ownerId: await brandIdForUser(auth.userId),
        contentType: body.contentType,
        sizeBytes: body.sizeBytes,
      }),
    {
      body: avatarRequestBody,
      detail: {
        summary: 'Get a signed URL for your logo',
        ...avatarDetail('brand'),
      },
      response: { 200: signedUpload },
    }
  )

  .put(
    '/picture',
    async ({ auth, body }) =>
      uploads.confirmAvatarUpload({
        owner: 'brands',
        ownerId: await brandIdForUser(auth.userId),
        storageKey: body.storageKey,
      }),
    {
      body: avatarConfirmBody,
      detail: {
        summary: 'Confirm your logo',
        ...avatarDetail('brand'),
        description:
          avatarDetail('brand').description +
          ' Until this is set, logoUrl is null everywhere it is read — the ' +
          'catalog, the storefront and every order row.',
      },
      response: { 200: avatarResult },
    }
  )
