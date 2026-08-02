import { describe, expect, test } from 'bun:test'
import { checkBarcode } from './barcode.ts'

describe('checkBarcode', () => {
  test('accepts real GTINs of every valid length', () => {
    for (const valid of [
      '96385074', // GTIN-8
      '036000291452', // GTIN-12, UPC-A
      '4006381333931', // GTIN-13, EAN-13
      '8850999320014', // GTIN-13, a Thai prefix (885)
      '10614141000415', // GTIN-14, case code
    ]) {
      expect(checkBarcode(valid)).toEqual({ ok: true })
    }
  })

  test('rejects a wrong check digit', () => {
    // 4006381333931 is valid; every other final digit must not be.
    for (const wrong of [0, 2, 3, 4, 5, 6, 7, 8, 9]) {
      expect(checkBarcode(`400638133393${wrong}`)).toMatchObject({
        ok: false,
        code: 'BARCODE_BAD_CHECK_DIGIT',
      })
    }
  })

  test('catches a transposition, which a length check would not', () => {
    // 4006381333931 with two adjacent digits swapped — still 13 digits.
    expect(checkBarcode('4006381333913')).toMatchObject({
      ok: false,
      code: 'BARCODE_BAD_CHECK_DIGIT',
    })
  })

  test('rejects lengths that are not a GTIN', () => {
    for (const bad of ['1', '1234567', '123456789', '123456789012345']) {
      expect(checkBarcode(bad)).toMatchObject({
        ok: false,
        code: 'BARCODE_BAD_LENGTH',
      })
    }
  })

  test('rejects anything not made only of digits', () => {
    for (const bad of ['', '4006381 33393', '4006-381-33393', 'ABCDEFGH']) {
      expect(checkBarcode(bad)).toMatchObject({
        ok: false,
        code: 'BARCODE_NOT_NUMERIC',
      })
    }
  })

  test('a leading zero is significant and preserved', () => {
    // 036000291452 is a valid UPC-A; dropping the zero is not a valid GTIN.
    expect(checkBarcode('036000291452')).toEqual({ ok: true })
    expect(checkBarcode('36000291452')).toMatchObject({
      ok: false,
      code: 'BARCODE_BAD_LENGTH',
    })
  })
})
