import { describe, expect, test } from 'bun:test'
import {
  DEFAULT_PACK_WEIGHT_GRAMS,
  FREE_SHIPPING_OVER_MINOR,
  SHIPPING_BANDS,
  amountToFreeShippingMinor,
  parcelWeightGrams,
  shippingFeeMinor,
} from './shipping.ts'

const UNDER_THRESHOLD = FREE_SHIPPING_OVER_MINOR - 1

describe('parcelWeightGrams', () => {
  test('adds up the packs actually ordered', () => {
    expect(
      parcelWeightGrams([
        { packWeightGrams: 250, packs: 4 },
        { packWeightGrams: 1_000, packs: 2 },
      ])
    ).toBe(3_000)
  })

  test('a line with no recorded weight falls back rather than counting zero', () => {
    // Free delivery on every unweighed product is the failure mode this
    // guards: the platform pays the courier either way.
    expect(parcelWeightGrams([{ packWeightGrams: null, packs: 3 }])).toBe(
      DEFAULT_PACK_WEIGHT_GRAMS * 3
    )
  })

  test('an empty parcel weighs nothing', () => {
    expect(parcelWeightGrams([])).toBe(0)
  })
})

describe('shippingFeeMinor', () => {
  test('each band charges its own price', () => {
    for (const band of SHIPPING_BANDS) {
      expect(
        shippingFeeMinor({
          weightGrams: band.maxGrams,
          subtotalMinor: UNDER_THRESHOLD,
        })
      ).toBe(band.feeMinor)
    }
  })

  test('the boundary belongs to the cheaper band', () => {
    // Exactly 1000 g is the 1 kg price, not the next one up.
    const first = SHIPPING_BANDS[0]!
    const second = SHIPPING_BANDS[1]!
    expect(
      shippingFeeMinor({
        weightGrams: first.maxGrams,
        subtotalMinor: UNDER_THRESHOLD,
      })
    ).toBe(first.feeMinor)
    expect(
      shippingFeeMinor({
        weightGrams: first.maxGrams + 1,
        subtotalMinor: UNDER_THRESHOLD,
      })
    ).toBe(second.feeMinor)
  })

  test('above the top band it charges by the kilo, rounded up', () => {
    const top = SHIPPING_BANDS[SHIPPING_BANDS.length - 1]!
    // 100 g over is still a whole extra kilo to a courier.
    expect(
      shippingFeeMinor({
        weightGrams: top.maxGrams + 100,
        subtotalMinor: UNDER_THRESHOLD,
      })
    ).toBe(top.feeMinor + 1_000)
    expect(
      shippingFeeMinor({
        weightGrams: top.maxGrams + 3_000,
        subtotalMinor: UNDER_THRESHOLD,
      })
    ).toBe(top.feeMinor + 3_000)
  })

  test('a big enough brand order ships free, whatever it weighs', () => {
    expect(
      shippingFeeMinor({
        weightGrams: 50_000,
        subtotalMinor: FREE_SHIPPING_OVER_MINOR,
      })
    ).toBe(0)
  })

  test('one satang short still pays', () => {
    // The threshold is the promise; paying at exactly the threshold would
    // make the number shown in the cart a lie.
    expect(
      shippingFeeMinor({ weightGrams: 500, subtotalMinor: UNDER_THRESHOLD })
    ).toBe(SHIPPING_BANDS[0]!.feeMinor)
  })

  test('nothing to send costs nothing', () => {
    expect(shippingFeeMinor({ weightGrams: 0, subtotalMinor: 1_000 })).toBe(0)
  })

  test('the fee never has a fraction of a satang', () => {
    for (const grams of [1, 999, 1_001, 20_001, 33_333]) {
      const fee = shippingFeeMinor({
        weightGrams: grams,
        subtotalMinor: UNDER_THRESHOLD,
      })
      expect(Number.isInteger(fee)).toBe(true)
    }
  })
})

describe('amountToFreeShippingMinor', () => {
  test('counts down to the threshold', () => {
    expect(amountToFreeShippingMinor(FREE_SHIPPING_OVER_MINOR - 31_000)).toBe(
      31_000
    )
  })

  test('zero once it qualifies, never negative', () => {
    expect(amountToFreeShippingMinor(FREE_SHIPPING_OVER_MINOR)).toBe(0)
    expect(amountToFreeShippingMinor(FREE_SHIPPING_OVER_MINOR * 2)).toBe(0)
  })
})
