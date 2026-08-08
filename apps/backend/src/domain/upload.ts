/**
 * Upload rules — pure, no Prisma, no I/O.
 *
 * A signed upload URL is a capability: whoever holds it can write that exact
 * object. So the *server* decides the content type and the path, and the
 * client only gets a URL. Letting a caller name its own key would let one
 * brand overwrite another's files.
 */

/** Product photos are shown in a browser, so only real image types. */
const PHOTO_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/**
 * Verification documents are read by an admin, never rendered in a page.
 * PDF is allowed here and nowhere else — a PDF can carry script, which is
 * harmless in a download but not in an <img> on a public page.
 */
const DOCUMENT_TYPES: Record<string, string> = {
  ...PHOTO_TYPES,
  'application/pdf': 'pdf',
}

/** Supabase enforces its own limit too; this fails earlier, with a message. */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024 // 5 MB
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024 // 10 MB

export type UploadCheck =
  { ok: true; extension: string } | { ok: false; code: string; message: string }

function check(
  allowed: Record<string, string>,
  contentType: string,
  sizeBytes: number,
  maxBytes: number
): UploadCheck {
  const extension = allowed[contentType]

  if (!extension) {
    return {
      ok: false,
      code: 'UNSUPPORTED_FILE_TYPE',
      message: `Allowed types: ${Object.keys(allowed).join(', ')}.`,
    }
  }

  if (!Number.isInteger(sizeBytes) || sizeBytes <= 0) {
    return {
      ok: false,
      code: 'INVALID_FILE_SIZE',
      message: 'File size must be a positive whole number of bytes.',
    }
  }

  if (sizeBytes > maxBytes) {
    return {
      ok: false,
      code: 'FILE_TOO_LARGE',
      message: `Maximum size is ${Math.floor(maxBytes / 1024 / 1024)} MB.`,
    }
  }

  return { ok: true, extension }
}

export function checkPhoto(contentType: string, sizeBytes: number) {
  return check(PHOTO_TYPES, contentType, sizeBytes, MAX_PHOTO_BYTES)
}

export function checkDocument(contentType: string, sizeBytes: number) {
  return check(DOCUMENT_TYPES, contentType, sizeBytes, MAX_DOCUMENT_BYTES)
}

/**
 * Where a product photo lives.
 *
 * Prefixed with the brand id so a brand can only ever write inside its own
 * folder, and suffixed with a random id so re-uploading does not silently
 * replace the old file while a page is still serving it from cache.
 */
export function photoKey(params: {
  brandId: string
  productId: string
  extension: string
  unique?: string
}): string {
  const unique = params.unique ?? crypto.randomUUID()
  return `brands/${params.brandId}/products/${params.productId}/${unique}.${params.extension}`
}

/**
 * A photo uploaded before its product exists.
 *
 * The Add Product form picks images while the product still has no id, so the
 * key cannot contain one. Brand-scoped is what matters for safety — the same
 * `keyBelongsToBrand` check applies — and the object simply stays under
 * `staging/` after the product is created rather than being copied, since
 * moving it would change a URL that is already recorded.
 */
export function stagedPhotoKey(params: {
  brandId: string
  extension: string
  unique?: string
}): string {
  const unique = params.unique ?? crypto.randomUUID()
  return `brands/${params.brandId}/staging/${unique}.${params.extension}`
}

/** Verification documents, in the private bucket, likewise brand-scoped. */
export function documentKey(params: {
  brandId: string
  documentType: string
  extension: string
  unique?: string
}): string {
  const unique = params.unique ?? crypto.randomUUID()
  return `brands/${params.brandId}/documents/${params.documentType}/${unique}.${params.extension}`
}

/**
 * A retailer's bank transfer slip, in the private bucket.
 *
 * Retailer-scoped like every other key, and the order id is in the path so an
 * admin looking at storage can tell which payment a file is evidence for
 * without a database round trip.
 *
 * `checkDocument` rather than `checkPhoto` governs what may be uploaded here:
 * banking apps hand out PDF receipts as readily as screenshots, and the slip
 * is only ever downloaded by an admin, never rendered into a page.
 */
export function paymentSlipKey(params: {
  retailerId: string
  orderId: string
  extension: string
  unique?: string
}): string {
  const unique = params.unique ?? crypto.randomUUID()
  return `retailers/${params.retailerId}/slips/${params.orderId}/${unique}.${params.extension}`
}

/** Whose folder an avatar lives in. Brands and retailers both have one. */
export type AvatarOwner = 'brands' | 'retailers'

/**
 * A profile picture — a brand's logo or a retailer's shop photo.
 *
 * Same shape as `photoKey`: owner-scoped folder so nobody can write outside
 * their own, and a random suffix so replacing a picture does not overwrite the
 * file a cached page is still serving.
 */
export function avatarKey(params: {
  owner: AvatarOwner
  ownerId: string
  extension: string
  unique?: string
}): string {
  const unique = params.unique ?? crypto.randomUUID()
  return `${params.owner}/${params.ownerId}/avatar/${unique}.${params.extension}`
}

/**
 * The same ownership check as `keyBelongsToBrand`, for either owner type.
 *
 * Kept as its own function rather than folded into that one: retailer ids and
 * brand ids are both UUIDs, so a check that ignored the folder prefix would
 * let a retailer confirm an upload into a brand's folder if the ids ever
 * collided.
 */
export function keyBelongsToOwner(
  key: string,
  owner: AvatarOwner,
  ownerId: string
): boolean {
  // A prefix check alone is not enough: "brands/b1/../b2/x.png" starts with
  // "brands/b1/" and still writes into b2's folder. Reject any traversal
  // segment outright rather than trying to normalise the path.
  if (key.split('/').includes('..')) return false

  return key.startsWith(`${owner}/${ownerId}/`)
}

/**
 * Does this key belong to this brand?
 *
 * Checked when a client confirms an upload, so a caller cannot hand back a key
 * pointing at someone else's object and have it recorded against their own
 * product.
 */
export function keyBelongsToBrand(key: string, brandId: string): boolean {
  return keyBelongsToOwner(key, 'brands', brandId)
}
