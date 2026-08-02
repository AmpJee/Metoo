import { Elysia, t } from 'elysia'
import { MAX_PRODUCT_IMAGES } from '../../domain/product-images.ts'
import { brandIdForUser } from '../../lib/profile.ts'
import { requireAccess } from '../../middleware/auth.ts'
import * as service from './service.ts'

const image = t.Object({
  id: t.String(),
  url: t.String(),
  /** 0 is the cover. Always contiguous — a delete closes the gap. */
  position: t.Integer(),
  altText: t.Union([t.String(), t.Null()]),
  createdAt: t.Date(),
})

export const productImagesModule = new Elysia({
  name: 'product-images',
  prefix: '/brand/products/:id/images',
})
  .use(requireAccess({ roles: ['BRAND'], approved: true }))

  .get(
    '/',
    async ({ auth, params }) =>
      service.list(await brandIdForUser(auth.userId), params.id),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      detail: {
        summary: 'Images on a product, in display order',
        tags: ['Brand · Product images'],
      },
      response: { 200: t.Array(image) },
    }
  )

  .post(
    '/',
    async ({ auth, params, body }) =>
      service.requestUpload({
        brandId: await brandIdForUser(auth.userId),
        productId: params.id,
        contentType: body.contentType,
        sizeBytes: body.sizeBytes,
      }),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({
        contentType: t.String({ maxLength: 100 }),
        sizeBytes: t.Integer({ minimum: 1 }),
      }),
      detail: {
        summary: 'Get a signed URL for another product image',
        description:
          `Step one of two. JPEG, PNG or WebP up to 5 MB, at most ` +
          `${MAX_PRODUCT_IMAGES} images per product — the limit is checked ` +
          `here rather than on confirm, so a rejection does not come after ` +
          `the client has already spent the upload. PUT the file to uploadUrl, ` +
          `then confirm with the returned storageKey.`,
        tags: ['Brand · Product images'],
      },
      response: {
        200: t.Object({ uploadUrl: t.String(), storageKey: t.String() }),
      },
    }
  )

  .put(
    '/',
    async ({ auth, params, body, set }) => {
      set.status = 201
      return service.confirmUpload({
        brandId: await brandIdForUser(auth.userId),
        productId: params.id,
        storageKey: body.storageKey,
        altText: body.altText,
      })
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({
        storageKey: t.String({ maxLength: 500 }),
        altText: t.Optional(t.String({ maxLength: 200 })),
      }),
      detail: {
        summary: 'Confirm an upload and add the image',
        description:
          'Appends to the end of the list. The first image a product gets ' +
          'also becomes its cover (photoUrl), which is what every card, cart ' +
          'line and order row renders.',
        tags: ['Brand · Product images'],
      },
      response: { 201: image },
    }
  )

  .patch(
    '/order',
    async ({ auth, params, body }) =>
      service.reorder({
        brandId: await brandIdForUser(auth.userId),
        productId: params.id,
        imageIds: body.imageIds,
      }),
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({
        imageIds: t.Array(t.String({ format: 'uuid' }), { minItems: 1 }),
      }),
      detail: {
        summary: 'Reorder the images',
        description:
          'Send every image id exactly once, in the order you want. A partial ' +
          'list is rejected rather than interpreted — it could mean "these ' +
          'first" or "delete the rest", and guessing wrong loses a photo. ' +
          'Whichever id is first becomes the cover.',
        tags: ['Brand · Product images'],
      },
      response: { 200: t.Array(image) },
    }
  )

  .delete(
    '/:imageId',
    async ({ auth, params }) =>
      service.remove({
        brandId: await brandIdForUser(auth.userId),
        productId: params.id,
        imageId: params.imageId,
      }),
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
        imageId: t.String({ format: 'uuid' }),
      }),
      detail: {
        summary: 'Delete an image',
        description:
          'Closes the gap in the ordering and re-points the cover if this was ' +
          'it. The file is deleted from storage too — otherwise a "deleted" ' +
          'photo stays publicly reachable at its URL.',
        tags: ['Brand · Product images'],
      },
      response: { 200: t.Object({ deleted: t.Boolean() }) },
    }
  )
