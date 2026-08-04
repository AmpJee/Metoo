/**
 * Uploads.
 *
 * Two steps, deliberately:
 *
 *   1. The brand asks for a signed URL. The server validates the type and size,
 *      builds a brand-scoped key, and returns a one-shot URL.
 *   2. The brand PUTs the file to Supabase, then confirms. Only then is
 *      anything recorded.
 *
 * The confirm step exists because the upload happens between the client and
 * Supabase — this API never sees it. Recording the row up front would leave
 * products pointing at photos that were never uploaded when a browser tab is
 * closed mid-transfer.
 */
import { prisma } from '../../config/prisma.ts'
import type { AvatarOwner } from '../../domain/upload.ts'
import {
  avatarKey,
  checkDocument,
  checkPhoto,
  documentKey,
  keyBelongsToBrand,
  keyBelongsToOwner,
  photoKey,
} from '../../domain/upload.ts'
import {
  PRIVATE_BUCKET,
  PUBLIC_BUCKET,
  createDocumentUploadUrl,
  createPhotoUploadUrl,
  objectExists,
  publicPhotoUrl,
} from '../../lib/supabase.ts'
import { AppError } from '../../middleware/error.ts'
import type { DocumentType } from '../../generated/prisma/client.ts'

/** A product this brand actually owns. */
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

export async function requestPhotoUpload(params: {
  brandId: string
  productId: string
  contentType: string
  sizeBytes: number
}) {
  const { brandId, productId, contentType, sizeBytes } = params

  await ownedProduct(brandId, productId)

  const check = checkPhoto(contentType, sizeBytes)
  if (!check.ok) {
    throw new AppError(422, check.code, check.message)
  }

  // Key built here, never taken from the client — that is what scopes a write
  // to this brand's own folder.
  const key = photoKey({ brandId, productId, extension: check.extension })

  return createPhotoUploadUrl(key)
}

/**
 * Record a photo once it is actually in the bucket.
 *
 * Two checks before writing: the key belongs to this brand, and the object is
 * really there. The first stops a caller pointing at someone else's file; the
 * second stops a product referencing an upload that failed.
 */
export async function confirmPhotoUpload(params: {
  brandId: string
  productId: string
  storageKey: string
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

  return prisma.product.update({
    where: { id: productId },
    data: { photoUrl: publicPhotoUrl(storageKey) },
    select: { id: true, name: true, photoUrl: true },
  })
}

export async function requestDocumentUpload(params: {
  brandId: string
  documentType: DocumentType
  contentType: string
  sizeBytes: number
}) {
  const { brandId, documentType, contentType, sizeBytes } = params

  const check = checkDocument(contentType, sizeBytes)
  if (!check.ok) {
    throw new AppError(422, check.code, check.message)
  }

  const key = documentKey({
    brandId,
    documentType,
    extension: check.extension,
  })

  return createDocumentUploadUrl(key)
}

/**
 * Record a verification document.
 *
 * This is the step that was missing: admin could already mint read URLs for
 * VerificationDocument rows, but nothing created them, so the ID and อย. check
 * the brief requires could never actually happen.
 *
 * Re-submitting the same type replaces the previous row rather than stacking —
 * an admin reviewing a brand should see one current certificate, not a history
 * of rejected attempts.
 */
export async function confirmDocumentUpload(params: {
  brandId: string
  documentType: DocumentType
  storageKey: string
}) {
  const { brandId, documentType, storageKey } = params

  if (!keyBelongsToBrand(storageKey, brandId)) {
    throw new AppError(
      403,
      'KEY_NOT_YOURS',
      'That upload does not belong to this brand.'
    )
  }

  if (!(await objectExists(PRIVATE_BUCKET, storageKey))) {
    throw new AppError(
      422,
      'UPLOAD_NOT_FOUND',
      'No file was found at that key. Upload it before confirming.'
    )
  }

  return prisma.$transaction(async (tx) => {
    await tx.verificationDocument.deleteMany({
      where: { brandId, type: documentType },
    })

    return tx.verificationDocument.create({
      data: {
        brandId,
        type: documentType,
        storageKey,
        // Back to PENDING on every resubmission: a replaced document has not
        // been looked at yet, whatever the old one's verdict was.
        status: 'PENDING',
      },
      select: {
        id: true,
        type: true,
        status: true,
        createdAt: true,
      },
    })
  })
}

/** What this brand has submitted, for its own onboarding screen. */
export function listOwnDocuments(brandId: string) {
  return prisma.verificationDocument.findMany({
    where: { brandId },
    // No storageKey and no signed URL: a brand knows what it uploaded, and
    // reading the file back is an admin capability.
    select: {
      id: true,
      type: true,
      status: true,
      reviewNote: true,
      reviewedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

// --- profile pictures --------------------------------------------------------

/**
 * A brand's logo and a retailer's shop photo are the same operation on two
 * tables, so one pair of functions serves both. `owner` decides the folder and
 * the row, and it comes from the route's guard — never from the request body.
 */
export async function requestAvatarUpload(params: {
  owner: AvatarOwner
  ownerId: string
  contentType: string
  sizeBytes: number
}) {
  const check = checkPhoto(params.contentType, params.sizeBytes)

  if (!check.ok) {
    throw new AppError(422, check.code, check.message)
  }

  const key = avatarKey({
    owner: params.owner,
    ownerId: params.ownerId,
    extension: check.extension,
  })

  return createPhotoUploadUrl(key)
}

export async function confirmAvatarUpload(params: {
  owner: AvatarOwner
  ownerId: string
  storageKey: string
}) {
  const { owner, ownerId, storageKey } = params

  if (!keyBelongsToOwner(storageKey, owner, ownerId)) {
    throw new AppError(
      403,
      'KEY_NOT_YOURS',
      'That upload does not belong to this account.'
    )
  }

  // Same reason as the product photo: never record a picture that is not
  // actually in the bucket, or the page renders a broken image.
  if (!(await objectExists(PUBLIC_BUCKET, storageKey))) {
    throw new AppError(
      422,
      'UPLOAD_NOT_FOUND',
      'No file was found at that key. Upload it before confirming.'
    )
  }

  const url = publicPhotoUrl(storageKey)

  if (owner === 'brands') {
    return prisma.brandProfile.update({
      where: { id: ownerId },
      data: { logoUrl: url },
      select: { id: true, name: true, logoUrl: true },
    })
  }

  const retailer = await prisma.retailerProfile.update({
    where: { id: ownerId },
    data: { avatarUrl: url },
    select: { id: true, shopName: true, avatarUrl: true },
  })

  // Same shape both ways, so one frontend component can render either.
  return {
    id: retailer.id,
    name: retailer.shopName,
    logoUrl: retailer.avatarUrl,
  }
}
