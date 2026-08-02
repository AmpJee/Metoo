/**
 * Barcode validation — pure, no Prisma, no I/O.
 *
 * A minimart scans the barcode at its own till, so a wrong one is not a
 * cosmetic error: it rings up as the wrong product, or as nothing at all, and
 * the shop finds out at the counter with a customer waiting.
 *
 * Retail barcodes are GTINs, and every GTIN carries a check digit computed
 * from the others. Verifying it catches the overwhelmingly common failure —
 * a mistyped or transposed digit — at the point of entry rather than at the
 * till, which a length check alone would let straight through.
 */

/** GTIN-8, GTIN-12 (UPC-A), GTIN-13 (EAN-13) and GTIN-14 (case codes). */
const GTIN_LENGTHS = [8, 12, 13, 14]

export type BarcodeCheck =
  | { ok: true }
  | {
      ok: false
      code:
        'BARCODE_NOT_NUMERIC' | 'BARCODE_BAD_LENGTH' | 'BARCODE_BAD_CHECK_DIGIT'
    }

/**
 * The GTIN check digit: weight the payload 3,1,3,1,… from the right, sum, and
 * the digit that rounds that sum up to a multiple of ten is the last one.
 */
function expectedCheckDigit(payload: string): number {
  let sum = 0

  for (let i = 0; i < payload.length; i++) {
    // Rightmost payload digit is weighted 3, then alternating.
    const weight = (payload.length - 1 - i) % 2 === 0 ? 3 : 1
    sum += Number(payload[i]) * weight
  }

  return (10 - (sum % 10)) % 10
}

export function checkBarcode(barcode: string): BarcodeCheck {
  if (!/^\d+$/.test(barcode)) {
    return { ok: false, code: 'BARCODE_NOT_NUMERIC' }
  }

  if (!GTIN_LENGTHS.includes(barcode.length)) {
    return { ok: false, code: 'BARCODE_BAD_LENGTH' }
  }

  const payload = barcode.slice(0, -1)
  const given = Number(barcode[barcode.length - 1])

  return given === expectedCheckDigit(payload)
    ? { ok: true }
    : { ok: false, code: 'BARCODE_BAD_CHECK_DIGIT' }
}
