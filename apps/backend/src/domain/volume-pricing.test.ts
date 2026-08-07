import { describe, expect, test } from 'bun:test'
import type { PriceTier } from './volume-pricing.ts'
import {
  MAX_TIERS,
  checkPriceTiers,
  lineTotalMinor,
  savingsMinor,
  quickPickQuantities,
  unitPriceMinor,
} from './volume-pricing.ts'

// The example from the design: ฿690 a pack, dropping to ฿635 at 20.
const BASE = 69000
const TIERS: PriceTier[] = [
  { minPacks: 20, pricePerPackMinor: 63500 },
  { minPacks: 30, pricePerPackMinor: 60000 },
]

describe('unitPriceMinor', () => {
  test('below the first threshold, the base price stands', () => {
    expect(unitPriceMinor(BASE, TIERS, 5)).toBe(BASE)
    expect(unitPriceMinor(BASE, TIERS, 19)).toBe(BASE)
  })

  test('the threshold itself qualifies', () => {
    expect(unitPriceMinor(BASE, TIERS, 20)).toBe(63500)
  })

  test('between thresholds, the lower tier holds', () => {
    expect(unitPriceMinor(BASE, TIERS, 25)).toBe(63500)
  })

  test('the highest qualifying tier wins', () => {
    expect(unitPriceMinor(BASE, TIERS, 30)).toBe(60000)
    expect(unitPriceMinor(BASE, TIERS, 500)).toBe(60000)
  })

  test('a product with no tiers always costs the base price', () => {
    expect(unitPriceMinor(BASE, [], 1000)).toBe(BASE)
  })

  test('order in the array does not decide the price', () => {
    // Rows come back from the database in whatever order; the answer must not.
    const shuffled = [...TIERS].reverse()
    expect(unitPriceMinor(BASE, shuffled, 30)).toBe(
      unitPriceMinor(BASE, TIERS, 30)
    )
  })
})

describe('lineTotalMinor', () => {
  test('the whole quantity gets the tier price, not a blend', () => {
    // 25 packs at the 20-pack rate — not 19 at base plus 6 discounted.
    expect(lineTotalMinor(BASE, TIERS, 25)).toBe(63500 * 25)
  })

  test('matches the design example', () => {
    expect(lineTotalMinor(BASE, TIERS, 20)).toBe(1_270_000) // ฿12,700
    expect(lineTotalMinor(BASE, TIERS, 10)).toBe(690_000) // ฿6,900
  })
})

describe('savingsMinor', () => {
  test('matches the design example', () => {
    // 20 × (690 − 635) = ฿1,100
    expect(savingsMinor(BASE, TIERS, 20)).toBe(110_000)
  })

  test('nothing saved below the first threshold', () => {
    expect(savingsMinor(BASE, TIERS, 10)).toBe(0)
  })

  test('never negative', () => {
    expect(savingsMinor(BASE, [], 10)).toBe(0)
  })
})

describe('checkPriceTiers', () => {
  const ok = (tiers: PriceTier[]) => checkPriceTiers(tiers, BASE, 6)

  test('accepts a sane ladder', () => {
    expect(ok(TIERS)).toEqual({ ok: true })
    expect(ok([])).toEqual({ ok: true })
  })

  test('a threshold at or below the minimum order is unreachable', () => {
    // minPacks is 6, so a 6-pack tier is just the base price with extra steps.
    expect(ok([{ minPacks: 6, pricePerPackMinor: 60000 }])).toMatchObject({
      ok: false,
      code: 'TIER_BELOW_MINIMUM',
    })
  })

  test('two tiers at the same quantity would make order decide the price', () => {
    expect(
      ok([
        { minPacks: 20, pricePerPackMinor: 63500 },
        { minPacks: 20, pricePerPackMinor: 60000 },
      ])
    ).toMatchObject({ ok: false, code: 'TIERS_NOT_ASCENDING' })
  })

  test('buying more must never cost more per pack', () => {
    expect(
      ok([
        { minPacks: 20, pricePerPackMinor: 63500 },
        { minPacks: 30, pricePerPackMinor: 66000 },
      ])
    ).toMatchObject({ ok: false, code: 'TIERS_NOT_CHEAPER' })
  })

  test('a tier at or above the base price is not a discount', () => {
    expect(ok([{ minPacks: 20, pricePerPackMinor: BASE }])).toMatchObject({
      ok: false,
      code: 'TIER_NOT_A_DISCOUNT',
    })
  })

  test('quantities and prices must be positive whole numbers', () => {
    expect(ok([{ minPacks: 0, pricePerPackMinor: 60000 }])).toMatchObject({
      ok: false,
      code: 'TIER_BAD_QUANTITY',
    })
    expect(ok([{ minPacks: 20, pricePerPackMinor: 0 }])).toMatchObject({
      ok: false,
      code: 'TIER_BAD_PRICE',
    })
    expect(ok([{ minPacks: 20.5, pricePerPackMinor: 60000 }])).toMatchObject({
      ok: false,
      code: 'TIER_BAD_QUANTITY',
    })
  })

  test('the ladder has a ceiling', () => {
    const many = Array.from({ length: MAX_TIERS + 1 }, (_, i) => ({
      minPacks: 10 + i * 10,
      pricePerPackMinor: BASE - (i + 1) * 1000,
    }))
    expect(ok(many)).toMatchObject({ ok: false, code: 'TIERS_TOO_MANY' })
  })
})

describe('quickPickQuantities', () => {
  test('every price break gets a button', () => {
    // A seller who set breaks at 20 and 30 has already said which quantities
    // matter; the buyer should be one tap from each.
    expect(quickPickQuantities(6, TIERS)).toEqual([6, 20, 30])
  })

  test('the minimum order leads, so the cheapest legal order is one tap away', () => {
    expect(quickPickQuantities(12, TIERS)[0]).toBe(12)
  })

  test('a flat-priced product falls back to its own presets', () => {
    expect(quickPickQuantities(5, [], [5, 10, 20])).toEqual([5, 10, 20])
  })

  test('presets and tiers merge without duplicating', () => {
    expect(quickPickQuantities(6, TIERS, [10, 20, 40])).toEqual([
      6, 10, 20, 30, 40,
    ])
  })

  test('a preset below the minimum order is dropped', () => {
    // It could never be ordered, so a button for it is a dead end.
    expect(quickPickQuantities(12, [], [5, 24])).toEqual([12, 24])
  })
})
