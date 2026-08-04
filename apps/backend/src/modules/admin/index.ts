/**
 * Admin routes — the sales pipeline the management console runs on.
 *
 * Every route here is admin-only. Note `approved` is deliberately not set:
 * admins are seeded rather than prospected, so gating them on the pipeline
 * they themselves operate would be circular.
 */
import { Elysia, t } from 'elysia'
import {
  CATEGORIES,
  FDA_STATUSES,
  PAYMENT_PREFERENCES,
  PAYMENT_RELIABILITIES,
  PIPELINE_STATUSES,
  ROLES,
  SHOP_TYPES,
  SIZE_BANDS,
} from '@metoo/shared'
import { optionalEnum } from '../../lib/schema.ts'
import { requireAccess } from '../../middleware/auth.ts'
import * as service from './service.ts'

const nullable = <T extends ReturnType<typeof t.String>>(schema: T) =>
  t.Union([schema, t.Null()])

const brandPipeline = t.Object({
  id: t.String(),
  name: t.String(),
  /** The Sellers table's Category column. Null on brands predating it. */
  category: t.Union([t.UnionEnum(CATEGORIES), t.Null()]),
  phone: t.String(),
  province: t.String(),
  fdaStatus: t.UnionEnum(FDA_STATUSES),
  sizeBand: t.Union([t.UnionEnum(SIZE_BANDS), t.Null()]),
  socialHandle: nullable(t.String()),
  caseWeightKg: t.Union([t.Number(), t.Null()]),
  caseDimensionsCm: nullable(t.String()),
  caseUnits: t.Union([t.Integer(), t.Null()]),
  existingRetailerCount: t.Union([t.Integer(), t.Null()]),
  referralSource: nullable(t.String()),
  adminNotes: nullable(t.String()),
  _count: t.Object({ products: t.Integer() }),
})

const retailerPipeline = t.Object({
  id: t.String(),
  shopName: t.String(),
  phone: t.String(),
  province: t.String(),
  shopType: t.Union([t.UnionEnum(SHOP_TYPES), t.Null()]),
  zone: nullable(t.String()),
  socialHandle: nullable(t.String()),
  currentProducts: nullable(t.String()),
  monthlyCapacity: t.Union([t.Integer(), t.Null()]),
  preferredPayment: t.Union([t.UnionEnum(PAYMENT_PREFERENCES), t.Null()]),
  paymentReliability: t.UnionEnum(PAYMENT_RELIABILITIES),
  deliveryWindow: nullable(t.String()),
  referralSource: nullable(t.String()),
  adminNotes: nullable(t.String()),
})

const applicant = t.Object({
  id: t.String(),
  email: t.String(),
  role: t.UnionEnum(ROLES),
  status: t.UnionEnum(PIPELINE_STATUSES),
  reviewNote: nullable(t.String()),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  brand: t.Union([brandPipeline, t.Null()]),
  retailer: t.Union([retailerPipeline, t.Null()]),
})

export const adminModule = new Elysia({ name: 'admin', prefix: '/admin' })
  .use(requireAccess({ roles: ['ADMIN'] }))

  .get(
    '/pipeline',
    ({ query }) =>
      service.listPipeline({
        status: query.status,
        role: query.role,
        q: query.q,
      }),
    {
      query: t.Object({
        // optionalEnum, not t.Optional(t.UnionEnum(...)) — the latter would
        // default an unfiltered request to the first value and silently hide
        // everyone else. See lib/schema.ts.
        status: optionalEnum(PIPELINE_STATUSES),
        role: optionalEnum(['BRAND', 'RETAILER'] as const),
        // The console's single search box: name, location, referral, handle.
        q: t.Optional(t.String({ maxLength: 100 })),
      }),
      detail: {
        summary: 'List brands and retailers in the pipeline',
        description:
          'Brands and retailers only; admin accounts are never prospected. ' +
          'Filter by status for a single column of the board. `q` is the ' +
          'console search box — it matches brand name, shop name, province, ' +
          'zone, referral source, social handle and email, case-insensitively, ' +
          'so one box works on either tab.',
        tags: ['Admin'],
      },
      response: { 200: t.Array(applicant) },
    }
  )

  .get(
    '/pipeline/:userId/documents',
    ({ params }) => service.listApplicantDocuments(params.userId),
    {
      params: t.Object({ userId: t.String({ format: 'uuid' }) }),
      detail: {
        summary: 'Verification documents for one applicant',
        description:
          'Each URL is a signed link into the private bucket and expires in ' +
          'five minutes. Do not cache or log this response. A brand needs an ' +
          'SME or National ID plus an อย. (FDA) certificate.',
        tags: ['Admin'],
      },
      response: {
        200: t.Array(
          t.Object({
            id: t.String(),
            type: t.UnionEnum(['SME_ID', 'NATIONAL_ID', 'FDA_CERT']),
            status: t.UnionEnum(['PENDING', 'APPROVED', 'REJECTED']),
            reviewNote: nullable(t.String()),
            createdAt: t.Date(),
            url: t.String(),
          })
        ),
      },
    }
  )

  .patch(
    '/pipeline/:userId/status',
    ({ params, body, auth }) =>
      service.setPipelineStatus({
        adminId: auth.userId,
        userId: params.userId,
        status: body.status,
        reviewNote: body.reviewNote,
      }),
    {
      params: t.Object({ userId: t.String({ format: 'uuid' }) }),
      body: t.Object({
        status: t.UnionEnum(PIPELINE_STATUSES),
        reviewNote: t.Optional(t.String({ maxLength: 1000 })),
      }),
      detail: {
        summary: 'Move an account along the pipeline',
        description:
          'ONBOARDED is the gate: until an account reaches it, every trading ' +
          'route returns 403. DECLINED requires a reviewNote, which is shown ' +
          'to the applicant. Every change writes an audit log entry.',
        tags: ['Admin'],
      },
      response: { 200: applicant },
    }
  )

  .patch(
    '/pipeline/:userId/fields',
    ({ params, body, auth }) =>
      service.updatePipelineFields({
        adminId: auth.userId,
        userId: params.userId,
        brand: body.brand,
        retailer: body.retailer,
      }),
    {
      params: t.Object({ userId: t.String({ format: 'uuid' }) }),
      body: t.Object({
        brand: t.Optional(
          t.Object(
            {
              // Core identity, editable here as well as by the brand itself.
              // Onboarding happens over the phone, often before the account has
              // ever signed in. Bank details are deliberately absent — see the
              // note on CoreBrandInput in service.ts.
              name: t.Optional(t.String({ minLength: 1, maxLength: 120 })),
              description: t.Optional(
                t.Union([t.String({ maxLength: 1000 }), t.Null()])
              ),
              phone: t.Optional(t.String({ minLength: 6, maxLength: 20 })),
              addressLine: t.Optional(
                t.String({ minLength: 1, maxLength: 200 })
              ),
              province: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
              postalCode: t.Optional(t.String({ minLength: 4, maxLength: 10 })),
              fdaStatus: t.Optional(t.UnionEnum(FDA_STATUSES)),
              sizeBand: t.Optional(t.UnionEnum(SIZE_BANDS)),
              socialHandle: t.Optional(t.String({ maxLength: 100 })),
              caseWeightKg: t.Optional(t.Number({ minimum: 0 })),
              caseDimensionsCm: t.Optional(t.String({ maxLength: 100 })),
              caseUnits: t.Optional(t.Integer({ minimum: 0 })),
              existingRetailerCount: t.Optional(t.Integer({ minimum: 0 })),
              referralSource: t.Optional(t.String({ maxLength: 200 })),
              adminNotes: t.Optional(t.String({ maxLength: 2000 })),
            }
            // NOTE: Elysia enforces unknown-key rejection on the top-level
            // body object but not on a nested one, so `additionalProperties:
            // false` here does nothing. A field that is not listed above is
            // silently dropped and the call still answers 200. The safety that
            // matters still holds — bankAccountNumber cannot be written from
            // here, verified — but the caller is not told it was ignored.
          )
        ),
        retailer: t.Optional(
          t.Object(
            {
              shopName: t.Optional(t.String({ minLength: 1, maxLength: 120 })),
              phone: t.Optional(t.String({ minLength: 6, maxLength: 20 })),
              addressLine: t.Optional(
                t.String({ minLength: 1, maxLength: 200 })
              ),
              province: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
              postalCode: t.Optional(t.String({ minLength: 4, maxLength: 10 })),
              taxId: t.Optional(
                t.Union([t.String({ maxLength: 20 }), t.Null()])
              ),
              shopType: t.Optional(t.UnionEnum(SHOP_TYPES)),
              zone: t.Optional(t.String({ maxLength: 200 })),
              socialHandle: t.Optional(t.String({ maxLength: 100 })),
              currentProducts: t.Optional(t.String({ maxLength: 500 })),
              monthlyCapacity: t.Optional(t.Integer({ minimum: 0 })),
              preferredPayment: t.Optional(t.UnionEnum(PAYMENT_PREFERENCES)),
              paymentReliability: t.Optional(
                t.UnionEnum(PAYMENT_RELIABILITIES)
              ),
              deliveryWindow: t.Optional(t.String({ maxLength: 100 })),
              referralSource: t.Optional(t.String({ maxLength: 200 })),
              adminNotes: t.Optional(t.String({ maxLength: 2000 })),
            }
            // Same as above: unlisted keys are dropped, not rejected.
          )
        ),
      }),
      detail: {
        summary: 'Edit a brand or retailer profile',
        description:
          'Two kinds of field in one call. The core profile — name, phone, ' +
          'address — which the account can also edit itself; and the internal ' +
          'sales columns only the console owns: อย. status, case spec, ' +
          'referral source, delivery window, notes. adminNotes is never shown ' +
          'to the account holder. ' +
          'Admin can edit the core fields because onboarding happens over the ' +
          'phone: someone is reading details back and correcting a mistyped ' +
          'address as they go, often before that account has ever signed in. ' +
          'Bank details are deliberately NOT here — an admin already reads ' +
          'them to make a payout, but rewriting where money lands is a very ' +
          'different risk from fixing a typo, so that stays with the brand. ' +
          'Fields not listed in this schema are ignored rather than rejected, ' +
          'so check the response to confirm what actually changed. ' +
          'Every change is audit logged.',
        tags: ['Admin'],
      },
      response: { 200: applicant },
    }
  )
