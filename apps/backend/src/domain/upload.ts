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
 * Does this key belong to this brand?
 *
 * Checked when a client confirms an upload, so a caller cannot hand back a key
 * pointing at someone else's object and have it recorded against their own
 * product.
 */
export function keyBelongsToBrand(key: string, brandId: string): boolean {
  return key.startsWith(`brands/${brandId}/`)
}
