import { describe, expect, test } from 'bun:test'
import {
  MAX_DOCUMENT_BYTES,
  MAX_PHOTO_BYTES,
  checkDocument,
  checkPhoto,
  documentKey,
  keyBelongsToBrand,
  photoKey,
  stagedPhotoKey,
} from './upload.ts'

describe('checkPhoto', () => {
  test('accepts the image types a browser renders', () => {
    for (const [type, ext] of [
      ['image/jpeg', 'jpg'],
      ['image/png', 'png'],
      ['image/webp', 'webp'],
    ] as const) {
      expect(checkPhoto(type, 1_000)).toEqual({ ok: true, extension: ext })
    }
  })

  test('rejects a PDF', () => {
    // Allowed for documents, never for a photo: a product image is rendered
    // in a page, and a PDF there is neither useful nor safe.
    expect(checkPhoto('application/pdf', 1_000)).toMatchObject({
      ok: false,
      code: 'UNSUPPORTED_FILE_TYPE',
    })
  })

  test('rejects anything executable or unknown', () => {
    for (const type of [
      'text/html',
      'image/svg+xml',
      'application/javascript',
      '',
    ]) {
      expect(checkPhoto(type, 1_000)).toMatchObject({ ok: false })
    }
  })

  test('accepts a file exactly at the limit', () => {
    expect(checkPhoto('image/png', MAX_PHOTO_BYTES)).toMatchObject({ ok: true })
  })

  test('rejects one byte over', () => {
    expect(checkPhoto('image/png', MAX_PHOTO_BYTES + 1)).toMatchObject({
      ok: false,
      code: 'FILE_TOO_LARGE',
    })
  })

  test('rejects zero, negative and fractional sizes', () => {
    for (const size of [0, -1, 1.5]) {
      expect(checkPhoto('image/png', size)).toMatchObject({
        ok: false,
        code: 'INVALID_FILE_SIZE',
      })
    }
  })
})

describe('checkDocument', () => {
  test('accepts a PDF as well as images', () => {
    expect(checkDocument('application/pdf', 1_000)).toEqual({
      ok: true,
      extension: 'pdf',
    })
    expect(checkDocument('image/jpeg', 1_000)).toEqual({
      ok: true,
      extension: 'jpg',
    })
  })

  test('allows a larger file than a photo', () => {
    // A scanned certificate is bigger than a product shot.
    expect(MAX_DOCUMENT_BYTES).toBeGreaterThan(MAX_PHOTO_BYTES)
    expect(checkDocument('application/pdf', MAX_PHOTO_BYTES + 1)).toMatchObject(
      { ok: true }
    )
  })

  test('still rejects unknown types', () => {
    expect(checkDocument('text/html', 1_000)).toMatchObject({ ok: false })
  })
})

describe('storage keys', () => {
  test('a photo key is scoped to the brand and product', () => {
    const key = photoKey({
      brandId: 'brand-1',
      productId: 'prod-9',
      extension: 'png',
      unique: 'abc',
    })
    expect(key).toBe('brands/brand-1/products/prod-9/abc.png')
  })

  test('a document key is scoped to the brand and document type', () => {
    const key = documentKey({
      brandId: 'brand-1',
      documentType: 'FDA_CERT',
      extension: 'pdf',
      unique: 'abc',
    })
    expect(key).toBe('brands/brand-1/documents/FDA_CERT/abc.pdf')
  })

  test('two uploads of the same file do not collide', () => {
    // Re-uploading must not replace a file a page is still serving.
    const a = photoKey({ brandId: 'b', productId: 'p', extension: 'png' })
    const b = photoKey({ brandId: 'b', productId: 'p', extension: 'png' })
    expect(a).not.toBe(b)
  })

  test('every key begins with its brand prefix', () => {
    const photo = photoKey({ brandId: 'b1', productId: 'p', extension: 'png' })
    const doc = documentKey({
      brandId: 'b1',
      documentType: 'SME_ID',
      extension: 'pdf',
    })
    expect(keyBelongsToBrand(photo, 'b1')).toBe(true)
    expect(keyBelongsToBrand(doc, 'b1')).toBe(true)
  })
})

describe('keyBelongsToBrand', () => {
  test("rejects another brand's key", () => {
    // A caller confirming an upload must not be able to point at someone
    // else's object and have it recorded against their own product.
    expect(keyBelongsToBrand('brands/other/products/p/x.png', 'mine')).toBe(
      false
    )
  })

  test('rejects a prefix that merely starts the same', () => {
    // "brand-10" must not pass as "brand-1".
    expect(
      keyBelongsToBrand('brands/brand-10/products/p/x.png', 'brand-1')
    ).toBe(false)
  })

  test('rejects a traversal attempt', () => {
    expect(keyBelongsToBrand('../../etc/passwd', 'b1')).toBe(false)
    expect(keyBelongsToBrand('brands/b1/../b2/x.png', 'b2')).toBe(false)
  })
})

describe('stagedPhotoKey', () => {
  test('is brand-scoped without needing a product id', () => {
    expect(
      stagedPhotoKey({ brandId: 'b1', extension: 'png', unique: 'u' })
    ).toBe('brands/b1/staging/u.png')
  })

  test('passes the same ownership check as any other brand key', () => {
    // This is the safety property: no product id, but still impossible to
    // write into another brand's folder.
    const key = stagedPhotoKey({ brandId: 'b1', extension: 'png' })
    expect(keyBelongsToBrand(key, 'b1')).toBe(true)
    expect(keyBelongsToBrand(key, 'b2')).toBe(false)
  })
})
