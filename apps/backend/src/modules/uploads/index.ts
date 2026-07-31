import { Elysia, t } from 'elysia'
import { MAX_DOCUMENT_BYTES, MAX_PHOTO_BYTES } from '../../domain/upload.ts'
import { brandIdForUser } from '../../lib/profile.ts'
import { requireAccess } from '../../middleware/auth.ts'
import * as service from './service.ts'

const DOCUMENT_TYPES = ['SME_ID', 'NATIONAL_ID', 'FDA_CERT'] as const

const signedUpload = t.Object({
  /** PUT the file here with the same content-type you declared. */
  uploadUrl: t.String(),
  token: t.String(),
  /** Hand this back to the confirm route once the PUT succeeds. */
  storageKey: t.String(),
})

/**
 * Product photos.
 *
 * Requires an ONBOARDED brand — the same gate as managing the product itself.
 */
export const uploadsModule = new Elysia({
  name: 'uploads',
  prefix: '/brand/products/:productId/photo',
})
  .use(requireAccess({ roles: ['BRAND'], approved: true }))

  .post(
    '/',
    async ({ auth, params, body }) =>
      service.requestPhotoUpload({
        brandId: await brandIdForUser(auth.userId),
        productId: params.productId,
        contentType: body.contentType,
        sizeBytes: body.sizeBytes,
      }),
    {
      params: t.Object({ productId: t.String({ format: 'uuid' }) }),
      body: t.Object({
        contentType: t.String({ maxLength: 100 }),
        sizeBytes: t.Integer({ minimum: 1, maximum: MAX_PHOTO_BYTES }),
      }),
      detail: {
        summary: 'Get a signed URL to upload a product photo',
        description:
          'Step one of two. The server decides the storage path — a client ' +
          'cannot choose where its file lands. PUT the file to uploadUrl, then ' +
          'confirm with the returned storageKey. JPEG, PNG or WebP up to 5 MB.',
        tags: ['Brand · Uploads'],
      },
      response: { 200: signedUpload },
    }
  )

  .put(
    '/',
    async ({ auth, params, body }) =>
      service.confirmPhotoUpload({
        brandId: await brandIdForUser(auth.userId),
        productId: params.productId,
        storageKey: body.storageKey,
      }),
    {
      params: t.Object({ productId: t.String({ format: 'uuid' }) }),
      body: t.Object({ storageKey: t.String({ maxLength: 500 }) }),
      detail: {
        summary: 'Confirm the photo upload',
        description:
          'Checks the key belongs to this brand and that the object really ' +
          'exists before recording it, so a product cannot end up pointing at ' +
          'an upload that failed halfway.',
        tags: ['Brand · Uploads'],
      },
      response: {
        200: t.Object({
          id: t.String(),
          name: t.String(),
          photoUrl: t.Union([t.String(), t.Null()]),
        }),
      },
    }
  )

/**
 * Verification documents.
 *
 * Deliberately NOT gated on `approved`: submitting an ID and an อย. certificate
 * is what a brand does *before* being onboarded. Requiring onboarding first
 * would make the documents unsubmittable and the approval unreachable.
 */
export const brandDocumentsModule = new Elysia({
  name: 'brand-documents',
  prefix: '/brand/documents',
})
  .use(requireAccess({ roles: ['BRAND'] }))

  .get(
    '/',
    async ({ auth }) =>
      service.listOwnDocuments(await brandIdForUser(auth.userId)),
    {
      detail: {
        summary: 'Documents this brand has submitted',
        description:
          'Status and any reviewer note, so a brand can see what is still ' +
          'outstanding. No file URL — reading the document back is an admin ' +
          'capability.',
        tags: ['Brand · Documents'],
      },
      response: {
        200: t.Array(
          t.Object({
            id: t.String(),
            type: t.UnionEnum(DOCUMENT_TYPES),
            status: t.UnionEnum(['PENDING', 'APPROVED', 'REJECTED']),
            reviewNote: t.Union([t.String(), t.Null()]),
            reviewedAt: t.Union([t.Date(), t.Null()]),
            createdAt: t.Date(),
          })
        ),
      },
    }
  )

  .post(
    '/',
    async ({ auth, body }) =>
      service.requestDocumentUpload({
        brandId: await brandIdForUser(auth.userId),
        documentType: body.type,
        contentType: body.contentType,
        sizeBytes: body.sizeBytes,
      }),
    {
      body: t.Object({
        type: t.UnionEnum(DOCUMENT_TYPES),
        contentType: t.String({ maxLength: 100 }),
        sizeBytes: t.Integer({ minimum: 1, maximum: MAX_DOCUMENT_BYTES }),
      }),
      detail: {
        summary: 'Get a signed URL to upload a verification document',
        description:
          'Brand approval needs an SME or National ID plus an อย. (FDA) ' +
          'certificate. Goes to the private bucket — only an admin can read ' +
          'it back, and only through a short-lived signed URL. PDF or image ' +
          'up to 10 MB.',
        tags: ['Brand · Documents'],
      },
      response: { 200: signedUpload },
    }
  )

  .put(
    '/',
    async ({ auth, body }) =>
      service.confirmDocumentUpload({
        brandId: await brandIdForUser(auth.userId),
        documentType: body.type,
        storageKey: body.storageKey,
      }),
    {
      body: t.Object({
        type: t.UnionEnum(DOCUMENT_TYPES),
        storageKey: t.String({ maxLength: 500 }),
      }),
      detail: {
        summary: 'Confirm the document upload',
        description:
          'Resubmitting a type replaces the previous one and resets it to ' +
          'PENDING — an admin should see one current certificate, not a ' +
          'history of rejected attempts, and a replacement has not been ' +
          'looked at yet whatever the old verdict was.',
        tags: ['Brand · Documents'],
      },
      response: {
        200: t.Object({
          id: t.String(),
          type: t.UnionEnum(DOCUMENT_TYPES),
          status: t.UnionEnum(['PENDING', 'APPROVED', 'REJECTED']),
          createdAt: t.Date(),
        }),
      },
    }
  )
