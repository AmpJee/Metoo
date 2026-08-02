/**
 * Product images.
 *
 * Same two-step upload as everything else: the server signs a URL, the client
 * PUTs to Supabase, then confirms. Only on confirm does a row appear.
 *
 * The invariant this file maintains: `Product.photoUrl` always equals the URL
 * of the image at position 0, and positions are always 0..n-1 with no gaps.
 * Every write that could break either does both in one transaction, because a
 * cover that disagrees with the gallery is visible on every card in the
 * catalog and there is no background job to repair it.
 */
import { prisma } from '../../config/prisma.ts'
import {
  MAX_PRODUCT_IMAGES,
  coverUrl,
  planReorder,
  positionsAfterRemoval,
} from '../../domain/product-images.ts'
import { checkPhoto, keyBelongsToBrand, photoKey } from '../../domain/upload.ts'
import {
  PUBLIC_BUCKET,
  createPhotoUploadUrl,
  objectExists,
  publicPhotoUrl,
  removeObject,
} from '../../lib/supabase.ts'
import { AppError } from '../../middleware/error.ts'

const imageSelect = {
  id: true,
  url: true,
  position: true,
  altText: true,
  createdAt: true,
}

/** A product this brand owns. 404, not 403 — see products/service.ts. */
async function ownedProduct(brandId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, brandId },
    select: { id: true },
  })

  if (!product) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'No such product.')
  }

  return product
}

export async function list(brandId: string, productId: string) {
  await ownedProduct(brandId, productId)

  return prisma.productImage.findMany({
    where: { productId },
    orderBy: { position: 'asc' },
    select: imageSelect,
  })
}

export async function requestUpload(params: {
  brandId: string
  productId: string
  contentType: string
  sizeBytes: number
}) {
  await ownedProduct(params.brandId, params.productId)

  const check = checkPhoto(params.contentType, params.sizeBytes)
  if (!check.ok) throw new AppError(422, check.code, check.message)

  const count = await prisma.productImage.count({
    where: { productId: params.productId },
  })

  // Checked before signing, not on confirm: refusing after the client has
  // already uploaded the file wastes their transfer and leaves an orphan.
  if (count >= MAX_PRODUCT_IMAGES) {
    throw new AppError(
      422,
      'TOO_MANY_IMAGES',
      `A product can have at most ${MAX_PRODUCT_IMAGES} images. Delete one first.`
    )
  }

  return createPhotoUploadUrl(
    photoKey({
      brandId: params.brandId,
      productId: params.productId,
      extension: check.extension,
    })
  )
}

/** Append an uploaded image to the end of the list. */
export async function confirmUpload(params: {
  brandId: string
  productId: string
  storageKey: string
  altText?: string
}) {
  const { brandId, productId, storageKey } = params

  await ownedProduct(brandId, productId)

  if (!keyBelongsToBrand(storageKey, brandId)) {
    throw new AppError(
      403,
      'KEY_NOT_YOURS',
      'That upload does not belong to this brand.'
    )
  }

  if (!(await objectExists(PUBLIC_BUCKET, storageKey))) {
    throw new AppError(
      422,
      'UPLOAD_NOT_FOUND',
      'No file was found at that key. Upload it before confirming.'
    )
  }

  const url = publicPhotoUrl(storageKey)

  return prisma.$transaction(async (tx) => {
    const existing = await tx.productImage.findMany({
      where: { productId },
      select: { id: true, url: true, position: true },
    })

    if (existing.length >= MAX_PRODUCT_IMAGES) {
      throw new AppError(
        422,
        'TOO_MANY_IMAGES',
        `A product can have at most ${MAX_PRODUCT_IMAGES} images.`
      )
    }

    const image = await tx.productImage.create({
      data: {
        productId,
        url,
        storageKey,
        position: existing.length,
        altText: params.altText?.trim() || null,
      },
      select: imageSelect,
    })

    // The first image uploaded becomes the cover.
    if (existing.length === 0) {
      await tx.product.update({
        where: { id: productId },
        data: { photoUrl: url },
      })
    }

    return image
  })
}

/**
 * Reorder the whole list. Position 0 becomes the cover.
 *
 * Positions are shifted out of the way first: `@@unique([productId, position])`
 * means writing them directly would collide the moment two images swap places.
 */
export async function reorder(params: {
  brandId: string
  productId: string
  imageIds: string[]
}) {
  const { brandId, productId, imageIds } = params

  await ownedProduct(brandId, productId)

  return prisma.$transaction(async (tx) => {
    const current = await tx.productImage.findMany({
      where: { productId },
      select: { id: true, url: true, position: true },
    })

    const plan = planReorder(
      current.map((image) => image.id),
      imageIds
    )

    if (!plan.ok) {
      throw new AppError(
        422,
        plan.code,
        plan.code === 'REORDER_EMPTY'
          ? 'Send the images in the order you want them.'
          : 'Send every image id exactly once — the list must be the same set, rearranged.'
      )
    }

    // Park everything above the used range, then write the real positions.
    for (const image of current) {
      await tx.productImage.update({
        where: { id: image.id },
        data: { position: image.position + current.length + 1000 },
      })
    }

    for (const [id, position] of plan.positions) {
      await tx.productImage.update({ where: { id }, data: { position } })
    }

    const reordered = current.map((image) => ({
      url: image.url,
      position: plan.positions.get(image.id)!,
    }))

    await tx.product.update({
      where: { id: productId },
      data: { photoUrl: coverUrl(reordered) },
    })

    return tx.productImage.findMany({
      where: { productId },
      orderBy: { position: 'asc' },
      select: imageSelect,
    })
  })
}

/**
 * Delete an image, close the gap, and re-point the cover if it was the cover.
 *
 * The object is removed from the bucket too. Leaving it would keep a "deleted"
 * photo publicly reachable at its URL for as long as the bucket lives.
 */
export async function remove(params: {
  brandId: string
  productId: string
  imageId: string
}) {
  const { brandId, productId, imageId } = params

  await ownedProduct(brandId, productId)

  const storageKey = await prisma.$transaction(async (tx) => {
    const current = await tx.productImage.findMany({
      where: { productId },
      select: { id: true, url: true, position: true, storageKey: true },
    })

    const target = current.find((image) => image.id === imageId)
    if (!target) {
      throw new AppError(
        404,
        'IMAGE_NOT_FOUND',
        'No such image on this product.'
      )
    }

    await tx.productImage.delete({ where: { id: imageId } })

    const positions = positionsAfterRemoval(current, imageId)
    for (const [id, position] of positions) {
      await tx.productImage.update({ where: { id }, data: { position } })
    }

    const survivors = current
      .filter((image) => image.id !== imageId)
      .map((image) => ({ url: image.url, position: positions.get(image.id)! }))

    await tx.product.update({
      where: { id: productId },
      data: { photoUrl: coverUrl(survivors) },
    })

    return target.storageKey
  })

  // After the transaction: if this fails the row is already gone, and an
  // orphaned object is a smaller problem than a row pointing at a deleted file.
  await removeObject(PUBLIC_BUCKET, storageKey)

  return { deleted: true }
}
