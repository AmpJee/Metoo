import { describe, expect, test } from 'bun:test'
import { checkQuantity, groupByBrand, lineTotalMinor } from './cart.ts'

describe('checkQuantity', () => {
  const rules = { minPacks: 10 }

  test('accepts exactly the minimum', () => {
    // The boundary itself must pass — an off-by-one would make the advertised
    // minimum unreachable.
    expect(checkQuantity(10, rules)).toEqual({ ok: true })
  })

  test('rejects one pack below the minimum', () => {
    const result = checkQuantity(9, rules)
    expect(result.ok).toBe(false)
    expect(result).toMatchObject({ code: 'BELOW_MIN_PACKS' })
  })

  test('accepts any pack count above the minimum', () => {
    // No divisibility rule: the design shows "Min 6 packs · 5 units/pack",
    // so 6 packs is valid even though 6 is not a multiple of 5. An earlier
    // version rejected this.
    for (const packs of [11, 13, 17, 100]) {
      expect(checkQuantity(packs, rules)).toEqual({ ok: true })
    }
  })

  test('a 6-pack order of a 5-units-per-pack product is valid', () => {
    // The exact case from the design's Slim Card Holder: Min 6 packs,
    // 5 units/pack, ordered as x6 packs.
    expect(checkQuantity(6, { minPacks: 6 })).toEqual({ ok: true })
  })

  test('a minimum of one accepts any positive count', () => {
    for (const packs of [1, 7, 9999]) {
      expect(checkQuantity(packs, { minPacks: 1 })).toEqual({ ok: true })
    }
  })

  test('rejects zero, negatives and fractions', () => {
    for (const bad of [0, -5, 2.5]) {
      expect(checkQuantity(bad, { minPacks: 1 })).toMatchObject({
        ok: false,
        code: 'INVALID_QUANTITY',
      })
    }
  })

  test('the message names the minimum', () => {
    const result = checkQuantity(3, { minPacks: 12 })
    if (result.ok) throw new Error('expected failure')
    expect(result.message).toContain('12')
  })
})

describe('lineTotalMinor', () => {
  test('multiplies pack price by pack count', () => {
    // The design's Slim Card Holder: ฿1,490/pack x 6 packs = ฿8,940
    expect(
      lineTotalMinor({ brandId: 'b1', pricePerPackMinor: 149_000, packs: 6 })
    ).toBe(894_000)
  })

  test('matches the design’s Classic Wallet line', () => {
    // ฿690/pack x 20 packs = ฿13,800
    expect(
      lineTotalMinor({ brandId: 'b1', pricePerPackMinor: 69_000, packs: 20 })
    ).toBe(1_380_000)
  })

  test('stays exact on values that would round badly as floats', () => {
    // 0.07 * 3 is 0.21000000000000002 in float arithmetic. Integer satang
    // makes that class of bug impossible, which is why money is stored this way.
    expect(
      lineTotalMinor({ brandId: 'b1', pricePerPackMinor: 7, packs: 3 })
    ).toBe(21)
  })
})

describe('groupByBrand', () => {
  const items = [
    { brandId: 'brand-a', pricePerPackMinor: 1000, packs: 2 },
    { brandId: 'brand-b', pricePerPackMinor: 500, packs: 4 },
    { brandId: 'brand-a', pricePerPackMinor: 250, packs: 8 },
  ]

  test('splits a multi-brand cart into one group per brand', () => {
    const groups = groupByBrand(items)
    expect(groups).toHaveLength(2)
    expect(groups.map((g) => g.brandId).sort()).toEqual(['brand-a', 'brand-b'])
  })

  test('subtotals each brand independently', () => {
    const groups = groupByBrand(items)
    expect(groups.find((g) => g.brandId === 'brand-a')?.subtotalMinor).toBe(
      1000 * 2 + 250 * 8
    )
    expect(groups.find((g) => g.brandId === 'brand-b')?.subtotalMinor).toBe(
      500 * 4
    )
  })

  test('keeps every line — nothing is dropped in grouping', () => {
    const total = groupByBrand(items).reduce((n, g) => n + g.items.length, 0)
    expect(total).toBe(items.length)
  })

  test('a single-brand cart yields exactly one group', () => {
    expect(groupByBrand([items[0]!])).toHaveLength(1)
  })

  test('an empty cart yields no groups', () => {
    expect(groupByBrand([])).toEqual([])
  })
})
